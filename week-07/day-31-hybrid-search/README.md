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
python run.py day27
```

## Run it

```bash
python run.py day31
python run.py day31 "citations_delta"
python run.py day31 "splitting long documents into smaller pieces"
```

With no query, it scores all three methods on the 16 [test queries](test_queries.py): 8 **exact** (like `numCandidates`, `pypdf`, `HISTORY_LIMIT`) and 8 **meaning** (phrased differently from the lessons).

## Results

Measured on this course's lesson READMEs (`python run.py day27`) when this lesson was written:

| Method | hit@1 | hit@3 | MRR | Exact terms (hit@1) | Meaning (hit@1) |
|---|---|---|---|---|---|
| Vector search | 5/16 | 9/16 | 0.50 | 1/8 | 4/8 |
| Keyword search | 6/16 | **15/16** | 0.65 | **3/8** | 3/8 |
| Hybrid (RRF) | **9/16** | **15/16** | **0.74** | **3/8** | **6/8** |

What this shows:

- **Vector search failed most exact-term queries.** Searching `citations_delta` returns the Day 29 citations lesson (similar *meaning*), not Day 30, where the word is used.
- **Keyword search gets almost every answer into the top 3**, but often not at #1: other lessons (including this one!) mention the same words. `numCandidates` appears in Day 24 *and* in this README.
- **Hybrid is the best overall**: it combines keyword search's top-3 coverage with vector search's feel for meaning. It still doesn't always put the right lesson first. Tomorrow's reranking helps with that.

## Reciprocal rank fusion

The two searches give scores on completely different scales (cosine similarity 0–1 vs BM25 scores like 2.1), so you can't just add them. RRF ignores the scores and uses only the **rank**:

```
score(chunk) = Σ  1 / (60 + rank in each list)
```

A chunk that's #1 in both lists scores 1/61 + 1/61. A chunk that's #1 in one list and missing from the other scores 1/61. Chunks both methods agree on rise to the top. It's in [`ailib/vector_store.py`](../../ailib/vector_store.py) as `reciprocal_rank_fusion()`, and it's about 10 lines.

## The metrics

| Metric | Meaning |
|---|---|
| **hit@1** | How often the right lesson is the very first result |
| **hit@3** | How often it's in the first three. For RAG this matters most: the model reads all the top chunks |
| **MRR** | Mean reciprocal rank: 1 point if first, ½ if second, ⅓ if third, then averaged. One number that rewards ranking higher |

## Try it

- Add 4 queries of your own to `test_queries.py`: 2 exact, 2 meaning. Do the results change?
- Change the `60` in RRF to `1` and to `1000`. What happens?
- Search in Nepali. Which method still works, and why?

## Homework

Add a weight to RRF so vector results count twice as much as keyword results. Find the weight with the best MRR on the test set, then explain why tuning on your test set can mislead you.
