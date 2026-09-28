"""Day 38 — Measuring RAG: grade retrieval and generation separately, to know WHAT to fix

Run: python run.py day38                            (all 30 questions)
     python run.py day38 --retrieval vector         (compare with plain vector search)
Needs the lessons ingested: python run.py day27
"""

import argparse
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ailib.mongo import mongo
from ailib.rag import answer_question

sys.path.insert(0, str(Path(__file__).parents[1]))  # week-08/, for the shared eval files
from eval_set import EVAL_SET  # noqa: E402
from judge import check_grounded, judge  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("--retrieval", default="hybrid+rerank", choices=["vector", "hybrid", "hybrid+rerank"])
retrieval = parser.parse_args().retrieval
K = 5


def diagnose(row: dict) -> str:
    """Where did it go wrong? Retrieval first, because generation can't use what it never saw."""
    if row["type"] == "unanswerable":
        return "ok" if row["correct"] else "made something up"
    if row["retrieval_hit"] and row["correct"]:
        return "ok"
    if not row["retrieval_hit"] and not row["correct"]:
        return f"fix RETRIEVAL: right lesson not in top {K}"
    if row["retrieval_hit"] and not row["correct"]:
        return "fix GENERATION: had the right chunks, answered badly"
    return "lucky: right answer without the right lesson"


print(f"Retrieval:                     {retrieval}, top {K}\n")
rows = []
with ThreadPoolExecutor(max_workers=2) as pool:
    for item in EVAL_SET:
        result = answer_question(item["question"], retrieval=retrieval, k=K)
        lessons = list(dict.fromkeys(c["source"].split("/")[1] for c in result["chunks"]))
        sources = item.get("sources", [])
        rank = next((i for i, lesson in enumerate(lessons, start=1) if any(lesson.startswith(s) for s in sources)), 0)
        # The judge and the groundedness check are independent: run them at the same time
        verdict_job = pool.submit(judge, item, result["answer"])
        grounded_job = pool.submit(check_grounded, result["answer"], result["chunks"])
        verdict, grounded = verdict_job.result(), grounded_job.result()
        row = {
            "id": item["id"],
            "type": item["type"],
            "retrieval_hit": rank > 0,
            "rank": rank,
            "correct": verdict.verdict == "correct",
            "grounded": grounded.grounded,
            "cited": bool(result["citations"]),
        }
        row["diagnosis"] = diagnose(row)
        rows.append(row)
        print(f"{'✅' if row['diagnosis'] == 'ok' else '❌'} {item['id']:<22} {row['diagnosis']}{'' if grounded.grounded else '  ⚠️ not grounded'}")
        for claim in grounded.unsupported_claims if not grounded.grounded else []:
            print(f'     unsupported: "{claim}"')

# ---- The report ------------------------------------------------------------------
answerable = [r for r in rows if r["type"] == "answerable"]
unanswerable = [r for r in rows if r["type"] == "unanswerable"]


def pct(n: int, d: int) -> str:
    return f"{n}/{d} ({round(n / d * 100) if d else 0}%)"


def count(rows_: list[dict], test) -> int:
    return sum(1 for r in rows_ if test(r))


mrr = sum(1 / r["rank"] for r in answerable if r["rank"]) / len(answerable)
print("\n── Retrieval ─────────────────────────────")
print(f"{f'Right lesson in top {K}:':<31}{pct(count(answerable, lambda r: r['retrieval_hit']), len(answerable))}")
print(f"MRR:                           {mrr:.2f}")
print("── Generation ────────────────────────────")
print(f"Correct answers:               {pct(count(answerable, lambda r: r['correct']), len(answerable))}")
print(f"Correct when retrieval hit:    {pct(count(answerable, lambda r: r['retrieval_hit'] and r['correct']), count(answerable, lambda r: r['retrieval_hit']))}")
print(f"Grounded in the documents:     {pct(count(rows, lambda r: r['grounded']), len(rows))}")
print(f"Answers with citations:        {pct(count(answerable, lambda r: r['cited']), len(answerable))}")
print(f"Said \"I don't know\" correctly: {pct(count(unanswerable, lambda r: r['correct']), len(unanswerable))}")
print("── What to fix ───────────────────────────")
for diagnosis, n in Counter(r["diagnosis"] for r in rows).most_common():
    print(f"{n:>3}  {diagnosis}")
mongo.close()
