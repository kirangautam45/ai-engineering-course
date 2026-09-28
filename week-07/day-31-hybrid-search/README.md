# Day 31: Hybrid Search

Vector search understands meaning, but it's surprisingly bad at **exact terms**: function names, error codes, product numbers, people's names. Keyword search is the opposite. Today you combine them.

## What you will learn

- Why vector search misses exact terms, and keyword search misses paraphrases
- **Keyword search** with Atlas Search (BM25 scoring, the classic search-engine algorithm)
- **Reciprocal rank fusion (RRF)**: a simple, robust way to merge two ranked lists
- Measuring retrieval with **hit@1**, **hit@3** and **MRR**

## Setup

Same database as Week 6. Ingest the lessons first; the keyword index is created automatically on the first run:

```bash
npm run day27
```

## Run it

```bash
npm run day31
npm run day31 -- "citations_delta"
npm run day31 -- "splitting long documents into smaller pieces"
```

With no query, it scores all three methods on the 16 [test queries](test-queries.js): 8 **exact** (like `numCandidates`, `unpdf`, `HISTORY_LIMIT`) and 8 **meaning** (phrased differently from the lessons).

## Results

Measured on this course's Week 1–6 lessons when this lesson was written:

| Method | hit@1 | hit@3 | MRR | Exact terms (hit@1) | Meaning (hit@1) |
|---|---|---|---|---|---|
| Vector search | 8/16 | 13/16 | 0.65 | 2/8 | 6/8 |
| Keyword search | **12/16** | 15/16 | **0.85** | **7/8** | 5/8 |
| Hybrid (RRF) | 10/16 | **16/16** | 0.81 | 4/8 | **6/8** |

What this shows:

- **Vector search failed most exact-term queries.** Searching `citations_delta` returns the Day 29 citations lesson (similar *meaning*), not Day 30, the only lesson that contains the word.
- **Keyword search is strong here**, because this course is full of code names. On everyday documents with fewer unique terms, it does worse.
- **Hybrid is the only method that gets every answer into the top 3**, but it's not the best at putting it first. Tomorrow's reranking fixes that.

## Reciprocal rank fusion

The two searches give scores on completely different scales (cosine similarity 0–1 vs BM25 scores like 2.1), so you can't just add them. RRF ignores the scores and uses only the **rank**:

```
score(chunk) = Σ  1 / (60 + rank in each list)
```

A chunk that's #1 in both lists scores 1/61 + 1/61. A chunk that's #1 in one list and missing from the other scores 1/61. Chunks both methods agree on rise to the top. It's in [`lib/vector-store.js`](../../lib/vector-store.js) as `reciprocalRankFusion()`, and it's 12 lines.

## The metrics

| Metric | Meaning |
|---|---|
| **hit@1** | How often the right lesson is the very first result |
| **hit@3** | How often it's in the first three. For RAG this matters most: the model reads all the top chunks |
| **MRR** | Mean reciprocal rank: 1 point if first, ½ if second, ⅓ if third, then averaged. One number that rewards ranking higher |

## Try it

- Add 4 queries of your own to `test-queries.js`: 2 exact, 2 meaning. Do the results change?
- Change the `60` in RRF to `1` and to `1000`. What happens?
- Search in Nepali. Which method still works, and why?

## Homework

Add a weight to RRF so vector results count twice as much as keyword results. Find the weight with the best MRR on the test set, then explain why tuning on your test set can mislead you.
