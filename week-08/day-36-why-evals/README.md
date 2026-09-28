# Day 36: Why Evals Matter

"I tried a few questions and it looked fine" isn't testing. Change one word in a prompt, swap the model, or add a reranker, and some answers get better while others quietly get worse. An **eval** (evaluation) is a fixed set of questions you run after every change, so you *know* instead of guessing.

## What you will learn

- What an **eval set** is and what goes in one
- Why you need questions the system **can't** answer, not just ones it can
- **Code-based checks**: fast, free, and never flaky
- Why you must **read the failures**, not just the score

## The eval set

[`../eval_set.py`](../eval_set.py) has 30 questions about this course:

| Type | Count | What a good answer does |
|---|---|---|
| **Answerable** | 22 | States the key facts, cites the right lesson |
| **Unanswerable** | 8 | Says it doesn't know (exam dates, fees, "Day 50", the capital of Australia...) |

Each answerable question lists the lesson(s) that answer it (`sources`), the facts a correct answer must contain (`must_mention`), and a human-written `reference` answer (used tomorrow). One question is in Nepali.

**Good eval questions** come from real users when you can get them, cover every kind of question the app gets, include edge cases (other languages, vague questions, things that aren't in the documents), and have answers you've checked yourself.

## Run it

```bash
python run.py day27                                # if the lessons aren't ingested yet
python run.py day36
python run.py day36 --only weather-api
python run.py day36 --retrieval vector          # compare with plain vector search
```

Each question gets ✅ or ❌ with the reasons, then a summary per type. Every answer is saved to `last-run.json` so you can read what was actually said.

## Code-based checks

[`../checks.py`](../checks.py) grades answers with plain Python:

| Check | For | How |
|---|---|---|
| Says it doesn't know | Unanswerable questions | A regular expression for "don't know", "not mentioned", "doesn't contain"... |
| Mentions the key facts | Answerable questions | Every `must_mention` item appears (case-insensitive); `["a", "b"]` means either is fine |
| Has citations | Answerable questions | At least one citation (Day 29) |
| Cites the right lesson | Answerable questions | A citation comes from one of the expected `sources` |

These checks cost nothing, run in milliseconds, and give the same result every time. Use them wherever a rule can be written in code.

**Their weakness:** they can't understand meaning. An answer that says "Open Meteo" (no hyphen) fails the check, and a wrong answer that happens to contain "Open-Meteo" passes. Tomorrow's LLM judge fills that gap.

## Read the failures

A score of 18/30 tells you almost nothing. Open `last-run.json` and read every failure. You'll usually find a mix of:

- **Real bugs**: retrieval missed the lesson, or the answer is wrong
- **Bad checks**: a correct answer worded differently from what the check expected
- **Bad questions**: ambiguous, or the "right" answer isn't actually in the lessons

Fix the checks and the questions too, not just the app.

## Try it

- Run with `--retrieval vector` and `--retrieval hybrid+rerank`. Which questions change?
- Write an answer to `capital` that should pass but fails the "doesn't know" check. Improve the regular expression.
- Add three questions about Week 7 lessons to the eval set.

## Homework

Write 10 more eval questions **for your own documents** (a syllabus, a handbook, notices), including 3 that the documents don't answer. Run them through Day 30 DocuChat by hand and record the results.
