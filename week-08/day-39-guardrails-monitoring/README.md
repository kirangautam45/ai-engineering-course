# Day 39: Guardrails and Monitoring

Your AI feature works on your laptop. On the internet, people will send it a thousand requests a minute, paste their passwords into it, and ask it things you never imagined. Today you add the guardrails that make it safe to run in public, and the logs that tell you what's happening.

## What you will learn

- **Rate limiting** per user, so one person can't run up your bill
- **Input limits** before you pay for anything
- **Redacting secrets and personal data** before they reach the model or your logs
- **Timeouts, retries and polite failures** when the AI service is slow or down
- **Structured logging** and a tiny monitoring dashboard

## Run it

```bash
npm run day27   # if the lessons aren't ingested yet
npm run day39
```

Then try the requests below (or use Postman):

```bash
curl -X POST localhost:3000/api/ask -H "Content-Type: application/json" -H "x-user-id: sita" -d '{"question":"Which free weather API does the course use?"}'
curl localhost:3000/api/stats
```

## The seven guardrails

All in [`server.js`](server.js), using helpers from [`lib/guardrails.js`](../../lib/guardrails.js):

| # | Guardrail | What happens |
|---|---|---|
| 1 | Small request bodies | `express.json({ limit: "5kb" })` rejects huge bodies |
| 2 | Rate limit | 5 questions per minute per user, then `429` with a `Retry-After` header |
| 3 | Input validation | Empty questions and questions over 500 characters get `400` |
| 4 | Redact the input | API keys, passwords, emails, Nepali phone numbers and card numbers are replaced with `[API_KEY REMOVED]` etc. **before** the model or the log sees them |
| 5 | Timeouts and retries | 30 seconds per attempt, 2 automatic retries for temporary errors |
| 6 | Check the output | The answer is redacted too: a document might contain someone's phone number |
| 7 | Fail politely | The user sees "The assistant is having trouble right now" and a `requestId`, never a stack trace |

Try pasting a fake key into a question: `"My key is sk-test-abcdefghijklmnopqrstuvwx, which weather API is used?"`. The answer comes back with a warning, and the log shows `[API_KEY REMOVED]`.

Redaction patterns catch common cases, not every case. They're a safety net: the real rule is still "don't ask users for secrets".

## Logging

Every request becomes one line of JSON in `logs/requests.jsonl`:

```json
{"time":"…","requestId":"c2945a7c-…","route":"/api/ask","user":"161e3ca9f09e","model":"claude-opus-5",
 "status":200,"latencyMs":609,"question":"Which free weather API…","stopReason":"end_turn",
 "sources":["week-04/day-17-multiple-tools/README.md"],"inputTokens":800,"outputTokens":60,"costUsd":0.0055,"redacted":[]}
```

- **Log what you need to debug**: request id, timing, tokens, cost, sources, errors.
- **Don't log what you don't need**: users are stored as a short one-way hash (`anonymize()`), and questions are logged only after redaction.
- **One JSON object per line** is easy to append to, search with `grep`, and load into any dashboard tool.

`GET /api/stats` reads the log and reports requests, errors, users, median and p95 latency, tokens, cost, refusals, and how many requests contained private data.

## In production

This lesson keeps everything in one process to stay simple. With real traffic you'd also:

- Keep rate-limit counts in Redis or MongoDB, so they work across several servers
- Send logs to a logging service instead of a local file, and set alerts (error rate, cost per hour)
- Set a **spending limit** in your API provider's console, the guardrail that works even when your code has a bug

## Try it

- Send 6 questions quickly as the same user, then as a different user.
- Stop the Atlas container (or set a wrong `ANTHROPIC_API_KEY`) and ask a question. What does the user see? What does the log contain?
- Add a pattern for Nepali citizenship numbers to `redact()`.

## Homework

Add a **daily budget** guardrail: once total `costUsd` for today reaches $1, return `503` with a friendly message until midnight.
