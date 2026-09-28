# Project Plan: <your project name>

**Student:** <name> · **Date:** <date>

## 1. The problem (2–3 sentences)

Who has the problem, what it is, and how they deal with it today.

> Example: *First-year students at my college ask the same questions about exam rules, fees and deadlines in WhatsApp groups every week. The answers are in PDF notices, but nobody can find them.*

## 2. The user

Who will use it? One specific person or group.

## 3. What it does (the demo in one sentence)

> Example: *Upload the college's notices, then ask "When is the fee deadline?" and get a cited answer in English or Nepali.*

## 4. Data

| Question | Answer |
|---|---|
| What documents or data does it use? | |
| Where do they come from? Do you have permission? | |
| How many, and how big? | |
| Do they contain personal data? How will you protect it? | |

## 5. Features

| Must have | Should have | Won't have |
|---|---|---|
| | | |

## 6. Techniques from the course

Tick the ones you'll use: ☐ RAG ☐ Citations ☐ Tools ☐ Streaming ☐ Structured output ☐ Hybrid search / reranking ☐ Evals ☐ Guardrails ☐ Other providers (`ailib/llm.py`)

## 7. How I'll measure success

- Eval set: 10 questions in `eval_set.py` (at least 3 unanswerable)
- Target: <e.g. 8/10 correct, all unanswerable questions answered "I don't know">
- Other: <e.g. answers in under 5 seconds, costs under $0.01 per question>

## 8. Risks

What could stop this from working, and what's your plan B?

> Example: *The notices are scanned images with no text. Plan B: type up the 10 most important ones.*

## 9. Plan

| Day | Goal |
|---|---|
| 42 | Core flow working end to end (ugly is fine) |
| 43 | Deployed at a public URL |
| 44 | Polish, eval score, README, demo script |
| 45 | Demo |
