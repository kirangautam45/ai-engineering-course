"""Day 40 — 🛠️ Reference solution: one command that scores the whole pipeline

Run: python run.py eval                          (full suite: code checks + LLM judge + groundedness)
     python run.py eval --quick                  (code checks only: free except for the answers)
     python run.py eval --retrieval vector       (score a different setup)
     python run.py eval --threshold 0.85         (fail if the score is below 85%)
Needs the lessons ingested: python run.py day27
"""

import argparse
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from ailib.claude import MODEL
from ailib.costs import cost_of
from ailib.mongo import mongo
from ailib.rag import answer_question

sys.path.insert(0, str(Path(__file__).parents[2]))  # week-08/, for the shared eval files
from checks import code_checks  # noqa: E402
from eval_set import EVAL_SET  # noqa: E402
from judge import check_grounded, judge  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("--quick", action="store_true", help="code checks only")
parser.add_argument("--retrieval", default="hybrid+rerank", choices=["vector", "hybrid", "hybrid+rerank"])
parser.add_argument("--threshold", type=float, default=0.8)
args = parser.parse_args()
REPORTS = Path(__file__).parents[1] / "reports"


# ---- 1. Run every question and grade it -------------------------------------------------
def evaluate_item(item: dict) -> dict:
    try:
        result = answer_question(item["question"], retrieval=args.retrieval)
        failures = code_checks(item, result)
        verdict = grounded = None
        if not args.quick:
            judged = judge(item, result["answer"])
            groundedness = check_grounded(result["answer"], result["chunks"])
            verdict, grounded = judged.verdict, groundedness.grounded
            if verdict != "correct":
                failures.append(f"judge: {verdict} ({judged.reasoning})")
            if not grounded:
                failures.append(f"not grounded: {'; '.join(groundedness.unsupported_claims)}")
        usage = result["usage"]
        return {"id": item["id"], "type": item["type"], "passed": not failures, "failures": failures,
                "verdict": verdict, "grounded": grounded, "answer": result["answer"],
                "usage": usage.model_dump(exclude_none=True) if usage else None}
    except Exception as error:  # noqa: BLE001 — one failed question shouldn't stop the run
        return {"id": item["id"], "type": item["type"], "passed": False, "failures": [f"error: {error}"]}


print(f"Eval: {len(EVAL_SET)} questions · retrieval {args.retrieval} · "
      f"{'code checks only' if args.quick else 'code + judge + groundedness'}\n")
started = time.perf_counter()
results = []
with ThreadPoolExecutor(max_workers=4) as pool:
    for r in pool.map(evaluate_item, EVAL_SET):
        print(f"{'✅' if r['passed'] else '❌'} {r['id']}")
        results.append(r)

# ---- 2. Summarize --------------------------------------------------------------------
passed = sum(r["passed"] for r in results)
score = passed / len(results)
by_type = {
    kind: f"{sum(r['passed'] for r in results if r['type'] == kind)}/{sum(r['type'] == kind for r in results)}"
    for kind in ("answerable", "unanswerable")
}
# What did the ANSWERS cost? (The judge's calls cost extra; keep an eye on both.)
answer_cost = sum((cost_of(r["usage"], MODEL) or 0) for r in results if r.get("usage"))

# ---- 3. Compare with the previous report to find REGRESSIONS ----------------------------
# Only compare like with like: the latest earlier run with the SAME settings
settings = {"model": MODEL, "retrieval": args.retrieval, "quick": args.quick}
REPORTS.mkdir(exist_ok=True)
previous_file = next(
    (f for f in sorted(REPORTS.glob("*.json"), reverse=True)
     if json.loads(f.read_text(encoding="utf-8"))["settings"] == settings),
    None,
)
previous = json.loads(previous_file.read_text(encoding="utf-8")) if previous_file else None
previously_passed = {r["id"] for r in previous["results"] if r["passed"]} if previous else set()
regressions = [r for r in results if not r["passed"] and r["id"] in previously_passed]
fixed = [r for r in results if r["passed"] and previous and r["id"] not in previously_passed]

# ---- 4. Save this report --------------------------------------------------------------
date = datetime.now(timezone.utc)
report = {
    "date": date.isoformat(),
    "settings": settings,
    "score": score,
    "byType": by_type,
    "answerCostUsd": round(answer_cost, 4),
    "seconds": round(time.perf_counter() - started),
    "results": results,
}
report_file = REPORTS / f"{date.strftime('%Y-%m-%dT%H-%M-%S')}.json"
report_file.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

# ---- 5. Print the result ---------------------------------------------------------------
print(f"\nScore: {passed}/{len(results)} ({round(score * 100)}%) · answerable {by_type['answerable']} · unanswerable {by_type['unanswerable']}")
print(f"Answers cost ${report['answerCostUsd']} · took {report['seconds']}s")
if previous:
    print(f"Previous run with these settings: {round(previous['score'] * 100)}% ({previous_file.name})")
    for r in regressions:
        print(f"  🔻 REGRESSION {r['id']}: {'; '.join(r['failures'])}")
    for r in fixed:
        print(f"  🔺 now passing: {r['id']}")
else:
    print("No earlier run with these settings to compare with.")
for r in results:
    if not r["passed"] and r not in regressions:
        print(f"  ❌ {r['id']}: {'; '.join(r['failures'])}")
print(f"Report saved: {report_file.relative_to(Path.cwd()) if report_file.is_relative_to(Path.cwd()) else report_file}")
mongo.close()

# A non-zero exit code makes CI (e.g. GitHub Actions) mark the run as failed
problems = [f"score below {args.threshold * 100:.0f}%"] * (score < args.threshold)
if regressions:
    problems.append(f"{len(regressions)} regression(s)")
if problems:
    print(f"\n❌ FAILED: {', '.join(problems)}")
    sys.exit(1)
print("\n✅ PASSED")
