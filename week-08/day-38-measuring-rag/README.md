# Day 38: Measuring RAG

"The answer was wrong" isn't enough to fix anything. A RAG system has two parts, and they fail differently. Today you measure **retrieval** and **generation** separately, so every failure points to the part to fix.

## What you will learn

- **Retrieval metrics**: was the right document in the top k? How high?
- **Generation metrics**: correctness, citations, and **groundedness** (is every claim supported by the retrieved text?)
- Diagnosing each failure: retrieval problem or generation problem?

## Run it

```bash
npm run day27   # if the lessons aren't ingested yet
npm run day38
npm run day38 -- --retrieval vector
```

## The report

```
── Retrieval ─────────────────────────────
Right lesson in top 5:         22/22 (100%)
MRR:                           0.87
── Generation ────────────────────────────
Correct answers:               …
Correct when retrieval hit:    …
Grounded in the documents:     …
Answers with citations:        …
Said "I don't know" correctly: …
── What to fix ───────────────────────────
```

The retrieval numbers above are real: with hybrid search and reranking (Week 7), the right lesson was in the top 5 for all 22 answerable questions, including the Nepali one. Your generation numbers depend on the model, so run it and see.

## The metrics

| Metric | Question it answers |
|---|---|
| **Right lesson in top k** (recall@k) | Did the model even *see* the answer? |
| **MRR** | How high was it ranked? (Day 31) |
| **Correct** (LLM judge, Day 37) | Is the final answer right? |
| **Correct when retrieval hit** | Given the right chunks, does the model answer well? This isolates generation. |
| **Grounded** | Is every claim supported by the retrieved chunks? |
| **Cited** | Does it show its sources? |

## Groundedness

`checkGrounded()` in [`../judge.js`](../judge.js) gives a model the retrieved chunks and the answer, and asks it to list every claim the chunks **don't** support. It needs no reference answer, so you can run it on real user traffic too.

It catches two problems that correctness alone misses:

- **Made-up answers**, even ones that sound right
- **True answers from the model's memory** instead of your documents. They're right today, but your documents are the source of truth: when your fees or dates change, memory won't.

## Diagnosing failures

| Right lesson retrieved? | Answer correct? | Diagnosis | Fix |
|---|---|---|---|
| ✅ | ✅ | ok | — |
| ❌ | ❌ | **Retrieval** failed: the model never saw the answer | Chunking, hybrid search, reranking, query rewriting (Weeks 5–7) |
| ✅ | ❌ | **Generation** failed: it had the answer and still got it wrong | Prompt, model, effort, fewer or better chunks |
| ❌ | ✅ | Lucky: another chunk happened to contain it | Check your `sources` labels |

Always look at retrieval first. No prompt can fix an answer the model never saw.

## Try it

- Run with `--retrieval vector`. Which failures move from "ok" to "fix RETRIEVAL"?
- Change `K` to 2. What happens to recall and to correctness?
- Find an answer that's correct but not grounded. Where did the extra information come from?

## Homework

Add a **context precision** metric: of the 5 retrieved chunks, how many came from an expected lesson? When would high recall but low precision be a problem?
