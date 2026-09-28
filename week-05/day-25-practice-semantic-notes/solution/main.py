"""Day 25 — 🛠️ Reference solution: a Notes API with semantic search

Run: python run.py day25   (needs MONGODB_URI pointing to Atlas or atlas-local)
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import uvicorn
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from pymongo.operations import SearchIndexModel

from ailib.embeddings import DIMENSIONS, embed
from ailib.mongo import db, mongo, wait_for_search_index

notes = db["notes"]
INDEX_NAME = "notes_vector_index"

# Never send the 384 numbers back to the client: they're big and useless to a person
WITHOUT_EMBEDDING = {"embedding": 0}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the vector index on first start
    if not list(notes.list_search_indexes(INDEX_NAME)):
        if "notes" not in db.list_collection_names():
            db.create_collection("notes")  # a search index can only be created on a collection that exists
        notes.create_search_index(SearchIndexModel(
            name=INDEX_NAME,
            type="vectorSearch",
            definition={"fields": [{"type": "vector", "path": "embedding", "numDimensions": DIMENSIONS, "similarity": "cosine"}]},
        ))
    wait_for_search_index(notes, INDEX_NAME)
    embed("warm up")  # load the model now, so the first request isn't slow
    yield
    mongo.close()


app = FastAPI(title="Notes API with semantic search", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, error: RequestValidationError):
    first = error.errors()[0]
    return JSONResponse({"error": f"{'.'.join(map(str, first['loc'][1:]))}: {first['msg']}"}, status_code=400)


@app.exception_handler(HTTPException)
async def http_error(request: Request, error: HTTPException):
    return JSONResponse({"error": error.detail}, status_code=error.status_code)


class NoteIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)


def to_json(note: dict) -> dict:
    """ObjectId and datetime aren't JSON: convert them for the response."""
    return {k: (str(v) if isinstance(v, ObjectId) else v.isoformat() if isinstance(v, datetime) else v) for k, v in note.items()}


def text_to_embed(note: NoteIn) -> str:
    """What gets embedded: the title and the content together, so both are searchable."""
    return f"{note.title}\n{note.content}"


def object_id(note_id: str) -> ObjectId:
    if not ObjectId.is_valid(note_id):
        raise HTTPException(404, "Note not found")
    return ObjectId(note_id)


# These endpoints are plain `def`, not `async def`: PyMongo and the embedding model are
# synchronous, and FastAPI runs plain `def` endpoints in a thread pool so they don't block each other.

# Semantic search. Declared before "/{note_id}" routes so "search" isn't treated as an id.
# GET /api/notes/search?q=exam dates&limit=5
@app.get("/api/notes/search")
def search_notes(q: str = Query(min_length=1), limit: int = Query(5, ge=1)):
    limit = min(limit, 20)
    [query_vector] = embed(q)
    results = notes.aggregate([
        {"$vectorSearch": {"index": INDEX_NAME, "path": "embedding", "queryVector": query_vector,
                           "numCandidates": limit * 20, "limit": limit}},
        {"$project": {"embedding": 0, "score": {"$meta": "vectorSearchScore"}}},
    ])
    return [to_json(n) for n in results]


@app.get("/api/notes")
def list_notes():
    return [to_json(n) for n in notes.find({}, WITHOUT_EMBEDDING).sort("createdAt", -1)]


@app.get("/api/notes/{note_id}")
def get_note(note_id: str):
    note = notes.find_one({"_id": object_id(note_id)}, WITHOUT_EMBEDDING)
    if not note:
        raise HTTPException(404, "Note not found")
    return to_json(note)


# Embed when a note is saved, so searching later is instant
@app.post("/api/notes", status_code=201)
def create_note(body: NoteIn):
    now = datetime.now(timezone.utc)
    note = {"title": body.title, "content": body.content, "embedding": embed(text_to_embed(body))[0], "createdAt": now, "updatedAt": now}
    result = notes.insert_one(note)
    return to_json({"_id": result.inserted_id, "title": body.title, "content": body.content, "createdAt": now})


# The text changed, so the embedding must change too — otherwise search finds the OLD meaning
@app.put("/api/notes/{note_id}")
def update_note(note_id: str, body: NoteIn):
    note = notes.find_one_and_update(
        {"_id": object_id(note_id)},
        {"$set": {"title": body.title, "content": body.content, "embedding": embed(text_to_embed(body))[0],
                  "updatedAt": datetime.now(timezone.utc)}},
        projection=WITHOUT_EMBEDDING,
        return_document=ReturnDocument.AFTER,
    )
    if not note:
        raise HTTPException(404, "Note not found")
    return to_json(note)


@app.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: str):
    if notes.delete_one({"_id": object_id(note_id)}).deleted_count == 0:
        raise HTTPException(404, "Note not found")
    return Response(status_code=204)


if __name__ == "__main__":
    uvicorn.run(app, port=int(os.getenv("PORT", "3000")))
