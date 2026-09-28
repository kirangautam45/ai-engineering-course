# Day 34: Prompt Caching and Cost Control

Some prompts repeat a large, unchanging part on every request: a long system prompt, a whole document, a chat history. **Prompt caching** lets you pay full price for that part once, and about 10% of the price each time it's reused.

## What you will learn

- How caching works: a **prefix** of the prompt is stored for 5 minutes and reused
- Where to put the `cache_control` marker, and why order matters
- Reading `cache_creation_input_tokens` and `cache_read_input_tokens`
- Calculating the real cost of a request, and tracking it

## Run it

```bash
npm run day34
```

The script puts **every lesson README in this course** (about 20,000 tokens) into the system prompt, with no retrieval at all ("long context"), and asks 3 questions.

## What you'll see

The shape of the output, from a test run:

```
Q1  written to cache: 19772 · read from cache: 0      cost $0.1247 (would be $0.1000 without caching)
Q2  written to cache: 0     · read from cache: 19772  cost $0.0110 (would be $0.1000 without caching)
Q3  written to cache: 0     · read from cache: 19772  cost $0.0110 (would be $0.1000 without caching)
Total: $0.1467 instead of $0.3000, 51% saved.
```

- **The first request costs a bit more** (writing to the cache costs 1.25× the normal input price).
- **Every later request reads the cache at 0.1×** of the normal input price, and usually responds faster too.
- The break-even is **2 requests**. After that, caching only saves money.

## The rules

1. **Stable content first, changing content last.** The cache is a *prefix*: everything up to the marker must be byte-for-byte identical. The course material goes in the system prompt; the question goes in `messages`.
2. **Mark the end of the stable part** with `cache_control: { type: "ephemeral" }`.
3. **The cache lasts 5 minutes** from the last use, and each hit resets the timer. (A 1-hour option exists at a higher write price.)
4. **There's a minimum size.** Prefixes shorter than the model's minimum (512 tokens on Claude Opus 5; more on some older models) are silently not cached. No error, just no saving.
5. **Check it's working.** If `cache_read_input_tokens` stays at 0 on repeat requests, something before the marker is changing. A date, a random id or reordered text is enough to miss every time.

## RAG or long context?

| | RAG (Weeks 5–7) | Long context + caching (today) |
|---|---|---|
| Works for | Any number of documents | Documents that fit in the context window |
| Per-question input | A few chunks (small) | Everything (large, but cached) |
| Can miss the answer? | Yes, if retrieval fails | No: the model sees everything |
| Setup | Ingestion, indexes, embeddings | None |

For a single handbook or a few long documents, long context with caching is often simpler and more accurate. For a library of thousands of files, you need RAG.

## Tracking costs

[`lib/costs.js`](../../lib/costs.js) turns a response's `usage` into dollars, including cache writes and reads. Update its price table from the pricing page when prices change.

## Try it

- Put `new Date().toISOString()` at the start of the system prompt. What happens to the cache?
- Move the question into the system prompt, before the course. Does caching still work?
- Wait 6 minutes between two runs. Is the first request a cache write again?

## Homework

Save the `usage` and cost of every request to a MongoDB `request_logs` collection (model, tokens, cost, time, route). Then build a page that shows the total cost per day and per conversation.
