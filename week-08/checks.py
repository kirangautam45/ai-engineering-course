"""Code-based checks: fast, free and never flaky. Use them wherever a rule can be written in code.

Each check returns a list of failure reasons: empty means it passed.
"""

import re

SAYS_DONT_KNOW = re.compile(
    r"(don't|do not|doesn't|does not|can't|cannot) (know|find|contain|include|mention|cover|say|provide|have)"
    r"|not (mentioned|covered|included|in the documents|stated)|no information|थाहा छैन",
    re.IGNORECASE,
)


def says_dont_know(answer: str) -> bool:
    return bool(SAYS_DONT_KNOW.search(answer))


def missing_facts(answer: str, must_mention: list) -> list[str]:
    """Does the answer mention every required fact? ["a", ["b", "c"]] means: "a" AND ("b" OR "c")"""
    lower = answer.lower()
    missing = []
    for fact in must_mention:
        options = fact if isinstance(fact, list) else [fact]
        if not any(option.lower() in lower for option in options):
            missing.append(" / ".join(options))
    return missing


def cites_expected_source(citations: list[dict], sources: list[str]) -> bool:
    """Did any citation come from one of the lessons that really answer the question?"""
    return any(f"/{s}" in c["source"] for c in citations for s in sources)


def code_checks(item: dict, result: dict) -> list[str]:
    """Run every check that applies to this item. Returns a list of failure reasons (empty = pass)."""
    failures = []
    if item["type"] == "unanswerable":
        if not says_dont_know(result["answer"]):
            failures.append("should say it doesn't know")
        return failures
    if says_dont_know(result["answer"]):
        failures.append("said it doesn't know")
    missing = missing_facts(result["answer"], item["must_mention"])
    if missing:
        failures.append(f"missing: {', '.join(missing)}")
    if not result["citations"]:
        failures.append("no citations")
    elif not cites_expected_source(result["citations"], item["sources"]):
        failures.append(f"didn't cite {' or '.join(item['sources'])}")
    return failures
