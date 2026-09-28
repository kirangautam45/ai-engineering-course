"""Day 23 — Chunking: which way of splitting documents finds answers best?

Run: python run.py day23
"""

import sys
from pathlib import Path

from ailib.chunking import chunk_by_headings, chunk_by_size
from ailib.embeddings import cosine_similarity, embed

sys.path.insert(0, str(Path(__file__).parent))
from test_queries import TEST_QUERIES  # noqa: E402

TOP_K = 3

docs = [{"file": str(f), "text": f.read_text(encoding="utf-8")} for f in sorted(Path(".").glob("week-0[1-4]/day-*/README.md"))]

# Three ways to turn documents into searchable pieces
strategies = {
    "Whole document (Day 22)": lambda doc: [{"text": doc["text"]}],
    "Fixed size, 80 words": lambda doc: chunk_by_size(doc["text"], size=80, overlap=20),
    "By heading, then size": lambda doc: chunk_by_headings(doc["text"], size=80, overlap=20),
}

query_vectors = embed([q["query"] for q in TEST_QUERIES])

for name, split in strategies.items():
    # 1. Chunk every document and remember which file each chunk came from (metadata!)
    chunks = [{**chunk, "file": doc["file"]} for doc in docs for chunk in split(doc)]
    vectors = embed([c["text"] for c in chunks])

    # 2. For each test question, find the best chunks and check whether the right file is in the top K
    hits = 0
    misses = []
    for test, query_vector in zip(TEST_QUERIES, query_vectors):
        ranked = sorted(zip(chunks, vectors), key=lambda cv: cosine_similarity(query_vector, cv[1]), reverse=True)
        # Several chunks can come from the same file; count each file once (dict keeps the order)
        top_files = list(dict.fromkeys(chunk["file"] for chunk, _ in ranked))[:TOP_K]
        if any(test["expect"] in file for file in top_files):
            hits += 1
        else:
            misses.append(test["query"])

    avg_words = round(sum(len(c["text"].split()) for c in chunks) / len(chunks))
    print(f"\n{name}")
    print(f"  {len(chunks)} chunks, ~{avg_words} words each")
    print(f"  Found the right lesson in the top {TOP_K} for {hits}/{len(TEST_QUERIES)} questions")
    for query in misses:
        print(f'    ✗ "{query}"')

# Show what a heading-based chunk looks like
sample_doc = docs[11]
sample = chunk_by_headings(sample_doc["text"])[3]
print(f'\nExample chunk from {sample_doc["file"]}:\n  "{sample["text"][:200]}..."')
