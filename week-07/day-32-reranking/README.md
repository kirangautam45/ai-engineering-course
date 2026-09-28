# Day 32: Reranking

Hybrid search got every answer into the top 3, but often not at #1. **Reranking** reorders the candidates with a more careful (and slower) model, so the best chunk comes first.

## What you will learn

- **Two-stage retrieval**: fast and broad first, then slow and precise
- The difference between a **bi-encoder** (embeddings) and a **cross-encoder** (reranker)
- Running a free reranker locally with Transformers.js
- Why a perfect score on a small test set should make you suspicious, not relaxed

## Run it

```bash
npm run day32
npm run day32 -- "stop paying for tokens when the user leaves the page"
```

The first run downloads the reranker (23 MB).

## Results

| Setup | hit@1 | hit@3 | MRR |
|---|---|---|---|
| Hybrid only | 10/16 | 16/16 | 0.81 |
| Hybrid + rerank | **16/16** | **16/16** | **1.00** |

Reranking 20 candidates took about 200 ms on a laptop.

**Be careful with this result.** 16 questions is a very small test set, and a perfect score usually means the test is too easy, not that the system is perfect. Look at the single-query example above: after reranking, #2–#5 are chunks from the embeddings lessons with low scores. For RAG those extra chunks matter too, because the model reads all of them. Week 8 builds a bigger, harder test set.

## Bi-encoder vs cross-encoder

| | Embedding model (bi-encoder) | Reranker (cross-encoder) |
|---|---|---|
| Reads | The question and each chunk **separately** | The question and a chunk **together** |
| Can pre-compute | Yes: chunk vectors are stored in advance | No: runs for every (question, chunk) pair |
| Speed | Searches millions of chunks in milliseconds | ~10 ms per pair |
| Accuracy | Good | Better: it sees how the words relate |

That's why you use both: the embedding model narrows millions of chunks to 20, and the reranker picks the best 5 of those 20.

## Walkthrough

1. `hybridRetrieve(q, { k: 20 })` gets 20 candidates (Day 31).
2. [`lib/rerank.js`](../../lib/rerank.js) builds 20 (question, chunk) pairs and runs the cross-encoder once over all of them.
3. The chunks are sorted by the reranker's score. Scores aren't probabilities: only their order matters.

## Choosing a reranker

| Option | Size | Languages | Cost |
|---|---|---|---|
| `Xenova/ms-marco-MiniLM-L-6-v2` (default) | 23 MB | English | Free, local |
| `onnx-community/bge-reranker-v2-m3-ONNX` | 576 MB | 100+ including Nepali | Free, local |
| A hosted reranker (e.g. Voyage AI) | — | Many | Pay per use |
| Ask Claude to score relevance | — | Many | An extra API call per question |

To switch, change `RERANK_MODEL` in `lib/rerank.js`. The English-only default scores a Nepali chunk as irrelevant even when it's the right answer, so use the multilingual one for Nepali documents.

## Try it

- Rerank 50 candidates instead of 20. Does quality or speed change more?
- Try the multilingual reranker on a Nepali question.
- Find a query where reranking makes the result *worse*.

## Homework

Write 10 harder test queries (vague questions, questions answered by two lessons, typos) and measure hybrid vs hybrid + rerank again. Is reranking still perfect?
