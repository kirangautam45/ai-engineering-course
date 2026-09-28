# Day 35: 🛠️ Practice Day — DocuChat 2

No new theory today. You apply everything from Week 7 to your Day 30 DocuChat, and prove each change helped with numbers.

## What you will build

| Upgrade | From | Why |
|---|---|---|
| Hybrid search | Day 31 | Finds exact names and codes that vector search misses |
| Reranking 20 → 5 | Day 32 | Puts the best chunk first |
| Chat mode with history | Day 13 | Users can ask follow-up questions |
| Query rewriting | Day 33 | Follow-ups become searchable |
| Prompt caching | Day 34 | The growing chat history is re-read at ~10% of the price |

## Requirements

1. **Retrieval**: `hybridRetrieve(query, { k: 20 })`, then `rerank(query, candidates, { top: 5 })`.
2. **Conversations**: `POST /api/ask` accepts an optional `conversationId`. The first event of every answer is `{ type: "conversation", id }`, which the page sends back with the next question.
3. **History**: store only plain questions and answers (never the documents), and keep at most the last 12 messages.
4. **Rewriting**: for follow-ups only, rewrite the question into a standalone query, and send `{ type: "rewritten", query }` so the page can show what was searched.
5. **Caching**: add top-level `cache_control: { type: "ephemeral" }` to the answer request, so the history prefix is cached automatically.
6. **Measure**: run the comparison below before and after, and put the numbers in your project's README.
7. Everything from Day 30 still works: uploads, citations, streaming, the document filter.

## Measure it

```bash
npm run day27
npm run day35:compare
```

[`solution/compare.js`](solution/compare.js) scores each stage on the Week 7 test queries. From a test run:

```
Setup                          hit@1   hit@3   MRR
Day 30: vector only            8/16    13/16   0.65
+ hybrid (Day 31)              10/16   16/16   0.81
+ hybrid + rerank (Day 32)     16/16   16/16   1.00
```

## Run the reference solution

Try building it yourself first. Then:

```bash
npm run day35
```

Open http://localhost:3000, upload a document, ask a question, then ask a follow-up like "which of those is most important?". The line under the question shows what was actually searched.

[`solution/server.js`](solution/server.js) is the Day 30 server with every change marked `NEW`, so you can compare the two files side by side. The page is in [`solution/public/index.html`](solution/public/index.html).

## Checklist

- [ ] A follow-up question shows a "🔁 Searched for" line; the first question doesn't
- [ ] "New conversation" starts fresh: the next question isn't rewritten
- [ ] An exact term from a document (a code, a name) is found
- [ ] Answers still have citations, and the document filter still works
- [ ] `npm run day35:compare` numbers are in your README

## Stretch goals

1. **Save conversations in MongoDB** (Day 13) instead of in memory, so they survive a server restart.
2. **Cost meter**: show the cost of each answer using [`lib/costs.js`](../../lib/costs.js) and the stream's final `usage`.
3. **Harder test set**: add 10 questions about your own uploaded documents to the comparison.
