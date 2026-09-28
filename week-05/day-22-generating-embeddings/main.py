"""Day 22 — Generating and storing embeddings

Run: python run.py day22 build                       (embed every lesson README, save to index.json)
     python run.py day22 search "how do I stop a stream?"
"""

import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from ailib.embeddings import EMBEDDING_MODEL, cosine_similarity, embed

INDEX_FILE = Path(__file__).parent / "index.json"
BATCH_SIZE = 8  # embed several texts per call: much faster than one at a time

command, *rest = sys.argv[1:] or [""]

if command == "build":
    # Every lesson README in the repo, e.g. week-01/day-01-first-call/README.md
    files = sorted(Path(".").glob("week-*/day-*/README.md"))
    docs = []
    for file in files:
        text = file.read_text(encoding="utf-8")
        title = (re.search(r"^# (.+)", text, re.M) or [None, str(file)])[1]
        docs.append({"file": str(file), "title": title, "text": text})

    print(f"Embedding {len(docs)} READMEs with {EMBEDDING_MODEL}...")
    started = time.perf_counter()
    for start in range(0, len(docs), BATCH_SIZE):
        batch = docs[start : start + BATCH_SIZE]
        for doc, vector in zip(batch, embed([d["text"] for d in batch])):
            doc["embedding"] = vector
        print(f"  {min(start + BATCH_SIZE, len(docs))}/{len(docs)}")

    # Save the vectors with their source, so we never embed the same text twice.
    # We store the model name too: vectors from different models can't be compared.
    index = {"model": EMBEDDING_MODEL, "createdAt": datetime.now(timezone.utc).isoformat(), "docs": docs}
    INDEX_FILE.write_text(json.dumps(index))
    kb = INDEX_FILE.stat().st_size // 1024
    print(f"Done in {time.perf_counter() - started:.1f}s. Saved index.json ({kb} KB).")

elif command == "search":
    query = " ".join(rest)
    if not query:
        sys.exit('Usage: python run.py day22 search "your question"')
    if not INDEX_FILE.exists():
        sys.exit("Run `python run.py day22 build` first.")

    index = json.loads(INDEX_FILE.read_text())
    if index["model"] != EMBEDDING_MODEL:
        sys.exit("The index was built with another model. Rebuild it.")

    # Embed the question with the SAME model, then compare it with every document
    [query_vector] = embed(query)
    results = sorted(index["docs"], key=lambda d: cosine_similarity(query_vector, d["embedding"]), reverse=True)[:5]

    print(f'🔎 "{query}"\n')
    for doc in results:
        print(f"  {cosine_similarity(query_vector, doc['embedding']):.3f}  {doc['title']}\n         {doc['file']}")

else:
    print('Usage:\n  python run.py day22 build\n  python run.py day22 search "your question"')
