"""Day 37 — LLM-as-judge: grade open-ended answers automatically, but check the judge first

Run: python run.py day37                 (check the judge against human grades)
     python run.py day37 --last-run      (judge the answers saved by Day 36, compare with the code checks)
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))  # week-08/, for the shared eval files
from eval_set import EVAL_SET  # noqa: E402
from human_labels import HUMAN_LABELS  # noqa: E402
from judge import judge  # noqa: E402

by_id = {item["id"]: item for item in EVAL_SET}
ICON = {"correct": "✅", "partially_correct": "🟡", "incorrect": "❌"}

if "--last-run" in sys.argv:
    # ---- Judge real answers from Day 36 ----------------------------------------------
    file = Path(__file__).parents[1] / "day-36-why-evals" / "last-run.json"
    if not file.exists():
        sys.exit("Run `python run.py day36` first.")
    results = json.loads(file.read_text(encoding="utf-8"))["results"]
    disagreements = 0
    for r in (r for r in results if r["answer"]):
        graded = judge(by_id[r["id"]], r["answer"])
        code_passed = not r["failures"]
        judge_passed = graded.verdict == "correct"
        disagree = code_passed != judge_passed
        disagreements += disagree
        print(f"{ICON[graded.verdict]} {r['id']:<22} code: {'pass' if code_passed else 'fail'}"
              + ("  ⚠️ judge and code checks disagree" if disagree else ""))
        if disagree:
            print(f"     {graded.reasoning}\n     Answer: {' '.join(r['answer'].split())[:200]}")
    print(f"\n{disagreements} disagreement(s). Read each one: which grader was right?")
else:
    # ---- Calibrate: does the judge agree with a human? ----------------------------------
    agree = 0
    for label in HUMAN_LABELS:
        graded = judge(by_id[label["item"]], label["answer"])
        same = graded.verdict == label["human"]
        agree += same
        print(f"{'✅' if same else '❌'} {label['item']:<20} human: {label['human']:<17} judge: {graded.verdict}")
        if not same:
            print(f"     \"{label['answer']}\"\n     Judge said: {graded.reasoning}")
    percent = round(agree / len(HUMAN_LABELS) * 100)
    print(f"\nThe judge agreed with the human on {agree}/{len(HUMAN_LABELS)} answers ({percent}%).")
    print("Good enough to use, but keep spot-checking." if percent >= 85 else "Too low to trust: improve the rubric, then run this again.")
