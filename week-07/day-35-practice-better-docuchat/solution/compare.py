"""Day 35 — Before-and-after retrieval scores for DocuChat, on the Week 7 test queries

Run: python run.py day35:compare   (needs the lessons ingested: python run.py day27)
"""

import sys
from pathlib import Path

from ailib.mongo import mongo
from ailib.rerank import rerank
from ailib.vector_store import ensure_index, hybrid_retrieve, retrieve

sys.path.insert(0, str(Path(__file__).parents[2] / "day-31-hybrid-search"))
from evaluate import evaluate  # noqa: E402

ensure_index()

setups = {
    "Day 30: vector only": lambda q: retrieve(q, k=10),
    "+ hybrid (Day 31)": lambda q: hybrid_retrieve(q, k=10),
    "+ hybrid + rerank (Day 32)": lambda q: rerank(q, hybrid_retrieve(q, k=20), top=10),
}

print("Setup                          hit@1   hit@3   MRR")
for name, search in setups.items():
    s = evaluate(search)["all"]
    hit1, hit3 = f"{s['hit1']}/{s['total']}", f"{s['hit3']}/{s['total']}"
    print(f"{name:<30} {hit1:<7} {hit3:<7} {s['mrr']:.2f}")
mongo.close()
