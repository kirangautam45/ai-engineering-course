"""Day 36 — Why evals matter: run the pipeline on a fixed test set and grade it with code

Run: python run.py day36                              (all 30 questions)
     python run.py day36 --only weather-api           (one question)
     python run.py day36 --retrieval vector           (compare with Day 28-style retrieval)
Needs the lessons ingested: python run.py day27
"""

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from ailib.mongo import mongo
from ailib.rag import answer_question

sys.path.insert(0, str(Path(__file__).parents[1]))  # week-08/, for the shared eval files
from checks import code_checks  # noqa: E402
from eval_set import EVAL_SET  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("--only", help="run one question by its id")
parser.add_argument("--retrieval", default="hybrid+rerank", choices=["vector", "hybrid", "hybrid+rerank"])
args = parser.parse_args()
items = [i for i in EVAL_SET if i["id"] == args.only] if args.only else EVAL_SET


def run(item: dict) -> dict:
    try:
        result = answer_question(item["question"], retrieval=args.retrieval)
        return {"item": item, "result": result, "failures": code_checks(item, result)}
    except Exception as error:  # noqa: BLE001 — one failed question shouldn't stop the run
        return {"item": item, "result": None, "failures": [f"error: {error}"]}


print(f"Running {len(items)} questions (retrieval: {args.retrieval})...\n")
results = []
# 4 at a time: fast, without hitting rate limits. map() keeps the original order.
with ThreadPoolExecutor(max_workers=4) as pool:
    for answered in pool.map(run, items):
        item, result, failures = answered["item"], answered["result"], answered["failures"]
        print(f"{'❌' if failures else '✅'} {item['id']:<22} {'; '.join(failures)}")
        results.append({
            "id": item["id"], "type": item["type"], "question": item["question"],
            "answer": result and result["answer"], "citations": result and result["citations"], "failures": failures,
        })

# Summary per type: you want to see WHERE it fails, not only how often
for kind in ("answerable", "unanswerable"):
    subset = [r for r in results if r["type"] == kind]
    if subset:
        print(f"\n{kind:<13} {sum(not r['failures'] for r in subset)}/{len(subset)} passed")
print(f"{'total':<13} {sum(not r['failures'] for r in results)}/{len(results)} passed")

# Save every answer: the failures only make sense when you read what was actually said
out = Path(__file__).parent / "last-run.json"
out.write_text(json.dumps({"retrieval": args.retrieval, "date": datetime.now(timezone.utc).isoformat(), "results": results},
                          indent=2, ensure_ascii=False), encoding="utf-8")
print("\nAll answers saved to week-08/day-36-why-evals/last-run.json. Read the failures!")
mongo.close()
