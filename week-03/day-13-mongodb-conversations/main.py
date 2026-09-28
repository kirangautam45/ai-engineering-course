"""Day 13 — Saving conversations in MongoDB

Run: python run.py day13  (needs MONGODB_URI in .env)
"""

import asyncio
import json
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import uvicorn
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field
from pymongo import AsyncMongoClient

from ailib.claude import MODEL, async_client

SYSTEM = "You are a friendly assistant for students. Keep answers clear. Use Markdown when it helps."
# Only the most recent messages are sent to the model, so long chats don't get
# slower and more expensive forever. Older messages stay saved in the database.
HISTORY_LIMIT = 20

if not os.getenv("MONGODB_URI"):
    sys.exit("Add MONGODB_URI to your .env file first (see .env.example).")
mongo = AsyncMongoClient(os.environ["MONGODB_URI"])
conversations = mongo.get_default_database("ai-course")["conversations"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongo.admin.command("ping")  # fail fast if the database is unreachable
    print("Connected to MongoDB")
    yield
    await mongo.close()


app = FastAPI(title="Day 13 Chat API with history", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, error: RequestValidationError):
    first = error.errors()[0]
    return JSONResponse({"error": f"{'.'.join(map(str, first['loc'][1:]))}: {first['msg']}"}, status_code=400)


@app.exception_handler(HTTPException)
async def http_error(request: Request, error: HTTPException):
    return JSONResponse({"error": error.detail}, status_code=error.status_code)  # {"error": ...} like the other lessons


def now() -> datetime:
    return datetime.now(timezone.utc)


def to_json(doc: dict) -> dict:
    """MongoDB ids and dates aren't JSON: turn them into strings for the browser."""
    return json.loads(json.dumps(doc, default=lambda value: value.isoformat() if isinstance(value, datetime) else str(value)))


async def find_conversation(conversation_id: str) -> dict:
    # Stop bad ids from reaching MongoDB, which would raise an error
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(404, "Conversation not found")
    conversation = await conversations.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(404, "Conversation not found")
    return conversation


# List conversations, newest first (without the messages, to keep it small)
@app.get("/api/conversations")
async def list_conversations():
    cursor = conversations.find({}, {"title": 1, "updatedAt": 1}).sort("updatedAt", -1).limit(50)
    return to_json(await cursor.to_list())


# Start a new, empty conversation
@app.post("/api/conversations", status_code=201)
async def create_conversation():
    conversation = {"title": "New chat", "messages": [], "createdAt": now(), "updatedAt": now()}
    result = await conversations.insert_one(conversation)
    return to_json({**conversation, "_id": result.inserted_id})


# Get one conversation with all its messages
@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    return to_json(await find_conversation(conversation_id))


@app.delete("/api/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str):
    if ObjectId.is_valid(conversation_id):
        await conversations.delete_one({"_id": ObjectId(conversation_id)})
    return Response(status_code=204)


class NewMessage(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# Send a message and stream the reply (same SSE format as Day 12).
# The client sends ONLY the new message; the server owns the history.
@app.post("/api/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, body: NewMessage):
    conversation = await find_conversation(conversation_id)
    content = body.content.strip()
    oid = conversation["_id"]

    # 1. Save the user's message first, so it's never lost
    update = {"$push": {"messages": {"role": "user", "content": content, "createdAt": now()}}, "$set": {"updatedAt": now()}}
    if not conversation["messages"]:
        update["$set"]["title"] = content[:50]
    await conversations.update_one({"_id": oid}, update)
    messages = [*conversation["messages"], {"role": "user", "content": content}]

    # 2. Build the history to send: the last HISTORY_LIMIT messages, starting with a user message
    history = [{"role": m["role"], "content": m["content"]} for m in messages[-HISTORY_LIMIT:]]
    while history[0]["role"] != "user":
        history = history[1:]

    async def events():
        answer = ""
        output_tokens = None
        try:
            async with async_client.messages.stream(model=MODEL, max_tokens=4096, system=SYSTEM, messages=history) as stream:
                async for text in stream.text_stream:
                    answer += text
                    yield sse({"type": "text", "text": text})
                final = await stream.get_final_message()
            output_tokens = final.usage.output_tokens
            yield sse({"type": "done", "stopReason": final.stop_reason, "usage": final.usage.model_dump(exclude_none=True)})
        except Exception as error:  # noqa: BLE001
            print("Stream failed:", error)
            yield sse({"type": "error", "message": "The AI service had a problem. Please try again."})
        finally:
            # 3. Save the reply — even a partial one if the user pressed Stop, so the history makes sense.
            # asyncio.shield lets the save finish even though the request is being cancelled.
            if answer:
                reply = {"role": "assistant", "content": answer, "outputTokens": output_tokens, "createdAt": now()}
                await asyncio.shield(conversations.update_one({"_id": oid}, {"$push": {"messages": reply}}))

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


if __name__ == "__main__":
    uvicorn.run(app, port=int(os.getenv("PORT", "3000")))
