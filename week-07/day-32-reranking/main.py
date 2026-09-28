"""Day 32 — Reranking: retrieve 20 candidates fast, then reorder them with a cross-encoder

Run: python run.py day32                                              (compares with and without reranking)
     python run.py day32 "stop paying for tokens when the user leaves the page"
Needs the lessons ingested first: python run.py day27
"""

import sys
import time
from pathlib import Path

from ailib.mongo import mongo
from ailib.rerank import RERANK_MODEL, rerank
from ailib.vector_store import ensure_index, hybrid_retrieve

sys.path.insert(0, str(Path(__file__).parent.parent / "day-31-hybrid-search"))
from evaluate import evaluate, print_summary  # noqa: E402

ensure_index()
CANDIDATES = 20
query = " ".join(sys.argv[1:])


def with_rerank(q: str) -> list[dict]:
    # Stage 1: fast and broad. Stage 2: slow and precise, but only on 20 chunks.
    return rerank(q, hybrid_retrieve(q, k=CANDIDATES), top=10)


if query:
    candidates = hybrid_retrieve(query, k=CANDIDATES)
    started = time.perf_counter()
    reranked = rerank(query, candidates, top=5)
    elapsed_ms = (time.perf_counter() - started) * 1000
    print(f'🔎 "{query}"\n\nBefore reranking (hybrid order):')
    for i, c in enumerate(candidates[:5], start=1):
        print(f"  {i}. {c['source']} (chunk {c['chunkIndex']})")
    print(f"\nAfter reranking with {RERANK_MODEL} ({elapsed_ms:.0f} ms for {len(candidates)} chunks):")
    for i, c in enumerate(reranked, start=1):
        was = next(j for j, x in enumerate(candidates, start=1) if (x["source"], x["chunkIndex"]) == (c["source"], c["chunkIndex"]))
        print(f"  {i}. {c['source']} (chunk {c['chunkIndex']})  score {c['rerank_score']:.2f}, was #{was}")
else:
    print_summary("Hybrid only", evaluate(lambda q: hybrid_retrieve(q, k=10)))
    print_summary(f"Hybrid + rerank ({RERANK_MODEL})", evaluate(with_rerank))
mongo.close()
