"""Scores a retrieval function on the test queries. Used by Days 31, 32 and 35."""

from test_queries import TEST_QUERIES


def evaluate(retrieve_fn) -> dict:
    """hit@1: the right lesson is the first result. hit@3: it's in the first 3 lessons.
    MRR (mean reciprocal rank): 1 if it's first, 1/2 if second, 1/3 if third... averaged."""
    rows = []
    for test in TEST_QUERIES:
        results = retrieve_fn(test["query"])
        lessons = list(dict.fromkeys(r["source"].split("/")[1] for r in results))  # distinct lesson folders, in order
        rank = next((i for i, lesson in enumerate(lessons, start=1) if any(lesson.startswith(e) for e in test["expect"])), 0)
        rows.append({"type": test["type"], "query": test["query"], "rank": rank})

    def summarize(subset: list[dict]) -> dict:
        return {
            "hit1": sum(r["rank"] == 1 for r in subset),
            "hit3": sum(1 <= r["rank"] <= 3 for r in subset),
            "mrr": sum(1 / r["rank"] for r in subset if r["rank"]) / len(subset),
            "total": len(subset),
        }

    return {
        "rows": rows,
        "all": summarize(rows),
        "exact": summarize([r for r in rows if r["type"] == "exact"]),
        "meaning": summarize([r for r in rows if r["type"] == "meaning"]),
    }


def print_summary(name: str, result: dict) -> None:
    def fmt(s: dict) -> str:
        return f"hit@1 {s['hit1']}/{s['total']}  hit@3 {s['hit3']}/{s['total']}  MRR {s['mrr']:.2f}"

    print(f"\n{name}")
    for part in ("all", "exact", "meaning"):
        print(f"  {part:<8} {fmt(result[part])}")
