"""Day 24 — Vector databases: store lesson chunks in MongoDB Atlas and search them

Run: python run.py day24 setup                                        (load chunks, create the index)
     python run.py day24 "how do I stream to the browser?"
     python run.py day24 "how do I stream to the browser?" --week week-01
"""

import re
import sys
from pathlib import Path

from pymongo.operations import SearchIndexModel

from ailib.chunking import chunk_by_size
from ailib.embeddings import DIMENSIONS, EMBEDDING_MODEL, embed
from ailib.mongo import db, mongo, wait_for_search_index

collection = db["lesson_chunks"]
INDEX_NAME = "lesson_vector_index"


def setup() -> None:
    # 1. Chunk every lesson README (fixed size won on Day 23) and keep useful metadata
    chunks = []
    for file in sorted(Path(".").glob("week-*/day-*/README.md")):
        text = file.read_text(encoding="utf-8")
        title = (re.search(r"^# (.+)", text, re.M) or [None, str(file)])[1]
        week = file.parts[0]  # e.g. "week-02"
        for i, chunk in enumerate(chunk_by_size(text)):
            chunks.append({"file": str(file), "title": title, "week": week, "chunkIndex": i, "text": chunk["text"]})

    # 2. Embed them in batches
    print(f"Embedding {len(chunks)} chunks...")
    for start in range(0, len(chunks), 16):
        batch = chunks[start : start + 16]
        for chunk, vector in zip(batch, embed([c["text"] for c in batch])):
            chunk["embedding"] = vector
            chunk["embeddingModel"] = EMBEDDING_MODEL

    # 3. Replace the old data. (Day 27 shows how to update only the files that changed.)
    collection.delete_many({})
    collection.insert_many(chunks)
    print(f'Saved {len(chunks)} chunks to the "lesson_chunks" collection.')

    # 4. Create the vector search index once. "filter" fields can be used to narrow a search.
    if not list(collection.list_search_indexes(INDEX_NAME)):
        collection.create_search_index(
            SearchIndexModel(
                name=INDEX_NAME,
                type="vectorSearch",
                definition={
                    "fields": [
                        {"type": "vector", "path": "embedding", "numDimensions": DIMENSIONS, "similarity": "cosine"},
                        {"type": "filter", "path": "week"},
                    ]
                },
            )
        )
        print(f'Created the "{INDEX_NAME}" vector index.')
    wait_for_search_index(collection, INDEX_NAME)
    print('Ready! Try: python run.py day24 "how do I stream to the browser?"')


def search(query: str, week: str | None) -> None:
    [query_vector] = embed(query)
    vector_search = {
        "index": INDEX_NAME,
        "path": "embedding",
        "queryVector": query_vector,
        "numCandidates": 100,  # how many close vectors to consider (more = more accurate, slower)
        "limit": 5,  # how many to return
    }
    if week:
        vector_search["filter"] = {"week": week}  # only works on fields declared as "filter" in the index

    results = collection.aggregate([
        {"$vectorSearch": vector_search},
        # Return just what we need, plus the similarity score
        {"$project": {"_id": 0, "title": 1, "file": 1, "text": 1, "score": {"$meta": "vectorSearchScore"}}},
    ])

    print(f'🔎 "{query}"' + (f" (only {week})" if week else "") + "\n")
    for r in results:
        print(f"{r['score']:.3f}  {r['title']}  ({r['file']})")
        print(f'       "{r["text"][:140]}..."\n')


args = sys.argv[1:]
week = None
if "--week" in args:
    i = args.index("--week")
    week = args[i + 1]
    del args[i : i + 2]

if args == ["setup"]:
    setup()
elif args:
    search(" ".join(args), week)
else:
    print(__doc__)
mongo.close()
