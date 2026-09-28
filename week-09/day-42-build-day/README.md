# Day 42: Build Day

Today is for building. By the end of class, your app's **core flow works end to end**: ugly, incomplete, but working. Everything else is polish.

## Build a walking skeleton first

Don't build one part perfectly and the next part later. Build the thinnest possible version of **every step**, connected, then improve each one:

```
Day 42 morning:  input ──▶ (fake data) ──▶ model call ──▶ print the answer        ✅ works
Day 42 midday:   input ──▶ real retrieval ──▶ model call ──▶ print the answer      ✅ works
Day 42 end:      web page ──▶ API ──▶ retrieval ──▶ model ──▶ streamed answer      ✅ works
```

At every step you have something that runs. If you run out of time, you still have a demo.

## Build order checklist

- [ ] **Data**: your documents are ingested (Day 27) and a search returns sensible chunks (Day 24). Check this first: nothing else works without it
- [ ] **Answer**: one question, from the terminal, answered correctly with citations
- [ ] **Evals**: run your 10 eval questions (Day 36, `--quick` style). Write down the score, even if it's 3/10
- [ ] **API**: an Express route returns the answer (Day 11)
- [ ] **Page**: a web page shows the answer (Days 12 / 14 / DocuChat Pro)
- [ ] **Commit** after every item on this list

## Starting from DocuChat Pro

If your project is about questions over documents, [DocuChat Pro](../docuchat-pro) already does the core flow:

```bash
npm run docuchat
```

Then make it yours:

1. Change the system prompt in `server.js` for your users (tone, language, what to say when it doesn't know).
2. Change the page's title and help text.
3. Ingest your own documents: `npm run day27 -- ./my-documents`, or upload them in the page.
4. Point your eval set at your documents and run it.

## When you're stuck

| Problem | First thing to check |
|---|---|
| Answers are wrong | What was **retrieved**? Print the chunks before blaming the model (Day 38) |
| "I don't know" to everything | Are your documents ingested? Is `MONGODB_URI` the right database? |
| Search finds nothing | Is the vector index `queryable`? Did you switch embedding provider without re-ingesting? |
| PDFs come out garbled | Print the extracted text (Day 27). Scanned PDFs have no text |
| Requests hang | Missing `await`? Check the server log and add a timeout (Day 39) |
| It costs too much | Log `usage` (Day 34). Lower `effort`, fewer chunks, cache stable prompts |

**The 20-minute rule:** if you've been stuck for 20 minutes, ask a classmate or the instructor. Explaining the problem out loud often solves it.

## End-of-day check

Show the instructor:

1. Your app answering one of your eval questions, end to end
2. Your eval score (any score is fine today)
3. Your commit history
