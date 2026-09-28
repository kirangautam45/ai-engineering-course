"""Day 31 — Hybrid search: vector search + keyword search, merged with reciprocal rank fusion

Run: python run.py day31                      (compares the three on the test queries)
     python run.py day31 "citations_delta"    (shows each method's results for one query)
Needs the lessons ingested first: python run.py day27
"""

import sys
from pathlib import Path

from ailib.mongo import mongo
from ailib.vector_store import ensure_index, hybrid_retrieve, keyword_search, retrieve

sys.path.insert(0, str(Path(__file__).parent))
from evaluate import evaluate, print_summary  # noqa: E402

ensure_index()  # creates the new keyword index on first run
query = " ".join(sys.argv[1:])

methods = {
    "Vector search (meaning)": lambda q: retrieve(q, k=10),
    "Keyword search (exact words)": lambda q: keyword_search(q, k=10),
    "Hybrid (both, fused)": lambda q: hybrid_retrieve(q, k=10),
}

if query:
    for name, search in methods.items():
        results = search(query)
        print(f"\n{name}:")
        for r in results[:3]:
            print(f"  {r['score']:.3f}  {r['source']} (chunk {r['chunkIndex']})")
        if not results:
            print("  (no results)")
else:
    for name, search in methods.items():
        print_summary(name, evaluate(search))
mongo.close()
