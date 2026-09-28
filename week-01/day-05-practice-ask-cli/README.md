# Day 05: 🛠️ Practice Day — A Reliable `ask` CLI

No new theory today. You combine Days 1–4 into a small tool that behaves well when things go wrong.

## What you will build

```bash
npm run day5 -- "What is the capital of Japan?"
npm run day5 -- --role "a travel guide for Nepal" "Plan one day in Pokhara"
npm run day5 -- --role "a strict code reviewer" "Is var or let better in JavaScript?"
```

## What this example shows

- **`--role` option**: builds the system prompt from the command line
- **`stop_reason` checks**: warns you when an answer was cut off or declined, instead of silently printing half an answer
- **Typed errors**: a wrong API key, a rate limit and a network failure each get a clear message
- **Fallbacks**: `fallbacks: "default"` lets the API retry a declined request on another model for you
- **`ask()`** in [`lib/ask.js`](../../lib/ask.js): a small reusable function we'll build on in later weeks

## Break it on purpose

Each of these should print a friendly error, not a crash:

1. Put a wrong key in `.env`
2. Turn off your Wi-Fi
3. Set `maxTokens` to `10`
4. Set `MODEL=not-a-real-model` in `.env`

## Practice tasks

1. Add a `--short` flag that asks for a one-sentence answer.
2. Add a `--json` flag that prints `{ "answer": ..., "tokens": ... }` instead of plain text.
3. Save every question and answer to `history.jsonl`, one JSON object per line.
4. **Stretch:** retry once, after 5 seconds, when you get a `RateLimitError`.
