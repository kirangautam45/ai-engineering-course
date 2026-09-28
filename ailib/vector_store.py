"""A small vector store on MongoDB Atlas: add documents, remove them, and retrieve the chunks
closest to a question. Used from Week 6 onward.
"""

import hashlib
import json
import time
from datetime import datetime, timezone

from pymongo.operations import SearchIndexModel

from ailib.chunking import chunk_by_size
from ailib.embeddings import DIMENSIONS, EMBEDDING_MODEL, embed
from ailib.mongo import db, wait_for_search_index

chunks = db["rag_chunks"]
INDEX_NAME = "rag_vector_index"
TEXT_INDEX_NAME = "rag_text_index"  # keyword (full-text) index, added in Week 7


def ensure_index() -> None:
    """Create the vector index once. "source" is a filter field so we can search inside one document."""
    definition = {
        "fields": [
            {"type": "vector", "path": "embedding", "numDimensions": DIMENSIONS, "similarity": "cosine"},
            {"type": "filter", "path": "source"},
        ]
    }
    existing = next(iter(chunks.list_search_indexes(INDEX_NAME)), None)

    # Switched embedding provider (e.g. local → openai)? The vector size changed, so the old index
    # can't be used: drop it, wait until it's gone, and create it again with the new size.
    fields = (existing or {}).get("latestDefinition", {}).get("fields", [])
    current = next((f.get("numDimensions") for f in fields if f.get("type") == "vector"), None)
    if current and current != DIMENSIONS:
        print(f"Embedding size changed ({current} → {DIMENSIONS}): rebuilding the vector index.")
        chunks.drop_search_index(INDEX_NAME)
        while list(chunks.list_search_indexes(INDEX_NAME)):
            time.sleep(1)
        existing = None

    if existing is None:
        if "rag_chunks" not in db.list_collection_names():
            db.create_collection("rag_chunks")  # a search index needs the collection to exist
        chunks.create_search_index(SearchIndexModel(name=INDEX_NAME, type="vectorSearch", definition=definition))
    wait_for_search_index(chunks, INDEX_NAME)

    # Week 7: a full-text index for keyword search on the same chunks
    if not list(chunks.list_search_indexes(TEXT_INDEX_NAME)):
        chunks.create_search_index(SearchIndexModel(
            name=TEXT_INDEX_NAME,
            type="search",
            definition={"mappings": {"dynamic": False, "fields": {"text": {"type": "string"}, "source": {"type": "token"}}}},
        ))
    wait_for_search_index(chunks, TEXT_INDEX_NAME)


def _hash_of(pages: list[dict]) -> str:
    """A fingerprint of the content: if it hasn't changed, we don't need to embed it again."""
    return hashlib.sha256(json.dumps(pages, sort_keys=True).encode()).hexdigest()


def upsert_document(source: str, pages: list[dict]) -> str:
    """Add or update one document. pages: [{"page", "text"}] from ailib/loaders.py.

    Returns "unchanged", "added" or "updated".
    """
    content_hash = _hash_of(pages)
    existing = chunks.find_one({"source": source}, {"hash": 1, "embeddingModel": 1})
    # Unchanged text AND the same embedding model: nothing to do
    if existing and existing.get("hash") == content_hash and existing.get("embeddingModel") == EMBEDDING_MODEL:
        return "unchanged"

    doc_chunks = [
        {"source": source, "page": page["page"], "text": chunk["text"]}
        for page in pages
        for chunk in chunk_by_size(page["text"], size=80, overlap=20)
    ]
    for start in range(0, len(doc_chunks), 32):
        batch = doc_chunks[start : start + 32]
        for chunk, vector in zip(batch, embed([c["text"] for c in batch])):
            chunk["embedding"] = vector

    # Replace the old version's chunks with the new ones
    now = datetime.now(timezone.utc)
    chunks.delete_many({"source": source})
    chunks.insert_many([
        {**chunk, "chunkIndex": i, "hash": content_hash, "embeddingModel": EMBEDDING_MODEL, "updatedAt": now}
        for i, chunk in enumerate(doc_chunks)
    ])
    return "updated" if existing else "added"


def remove_document(source: str) -> int:
    return chunks.delete_many({"source": source}).deleted_count


def list_documents() -> list[dict]:
    """One row per document: its name, number of chunks and pages, and when it was last updated."""
    return list(chunks.aggregate([
        {"$group": {"_id": "$source", "chunks": {"$sum": 1}, "pages": {"$max": "$page"}, "updatedAt": {"$max": "$updatedAt"}}},
        {"$project": {"_id": 0, "source": "$_id", "chunks": 1, "pages": 1, "updatedAt": 1}},
        {"$sort": {"source": 1}},
    ]))


PROJECT = {"_id": 0, "source": 1, "page": 1, "chunkIndex": 1, "text": 1}


def retrieve(question: str, k: int = 5, source: str | None = None) -> list[dict]:
    """Find the k chunks closest in meaning to the question. Optionally only inside one source."""
    [query_vector] = embed(question)
    vector_search = {"index": INDEX_NAME, "path": "embedding", "queryVector": query_vector, "numCandidates": k * 20, "limit": k}
    if source:
        vector_search["filter"] = {"source": source}
    return list(chunks.aggregate([
        {"$vectorSearch": vector_search},
        {"$project": {**PROJECT, "score": {"$meta": "vectorSearchScore"}}},
    ]))


# ---- Week 7: keyword and hybrid search ---------------------------------------

def keyword_search(question: str, k: int = 5, source: str | None = None) -> list[dict]:
    """Classic keyword search (Atlas Search, BM25 scoring): great for exact names, codes and error messages."""
    text = {"query": question, "path": "text"}
    search = ({"compound": {"must": [{"text": text}], "filter": [{"equals": {"path": "source", "value": source}}]}}
              if source else {"text": text})
    return list(chunks.aggregate([
        {"$search": {"index": TEXT_INDEX_NAME, **search}},
        {"$limit": k},
        {"$project": {**PROJECT, "score": {"$meta": "searchScore"}}},
    ]))


def reciprocal_rank_fusion(lists: list[list[dict]], k: int = 60) -> list[dict]:
    """Merge several ranked lists into one.

    A chunk gets 1 / (60 + rank) from every list it appears in, so chunks that rank well
    in BOTH lists rise to the top. Only ranks are used, so the lists' different scores don't matter.
    """
    fused: dict[str, dict] = {}
    for results in lists:
        for rank, chunk in enumerate(results):
            key = f"{chunk['source']}#{chunk['chunkIndex']}"
            entry = fused.setdefault(key, {**chunk, "score": 0.0})
            entry["score"] += 1 / (k + rank + 1)
    return sorted(fused.values(), key=lambda c: c["score"], reverse=True)


def hybrid_retrieve(question: str, k: int = 5, source: str | None = None, candidates: int = 20) -> list[dict]:
    """Hybrid search: vector search AND keyword search, merged with reciprocal rank fusion."""
    by_meaning = retrieve(question, k=candidates, source=source)
    by_keyword = keyword_search(question, k=candidates, source=source)
    return reciprocal_rank_fusion([by_meaning, by_keyword])[:k]
