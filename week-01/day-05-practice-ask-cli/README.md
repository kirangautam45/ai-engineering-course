# Day 05: 🛠️ Practice Day — A Reliable `ask` CLI

No new theory today. You combine Days 1–4 into a small tool that behaves well when things go wrong.

## What you will build

```bash
python run.py day5 "What is the capital of Japan?"
python run.py day5 --role "a travel guide for Nepal" "Plan one day in Pokhara"
python run.py day5 --role "a strict code reviewer" "Are list comprehensions better than for loops?"
```

## What this example shows

- **`--role` option**: builds the system prompt from the command line
- **`stop_reason` checks**: warns you when an answer was cut off or declined, instead of silently printing half an answer
- **Typed errors**: a wrong API key, a rate limit and a network failure each get a clear message
- **Fallbacks**: `fallbacks: "default"` lets the API retry a declined request on another model for you
- **`ask()`** in [`ailib/ask.py`](../../ailib/ask.py): a small reusable function we'll build on in later weeks
- **`argparse`**: Python's built-in way to read command-line options, with `--help` for free

## Break it on purpose

Each of these should print a friendly error, not a crash:

1. Put a wrong key in `.env`
2. Turn off your Wi-Fi
3. Set `max_tokens` to `10` in `ask()`
4. Set `MODEL=not-a-real-model` in `.env`

## Practice tasks

1. Add a `--short` flag that asks for a one-sentence answer.
2. Add a `--json` flag that prints `{ "answer": ..., "tokens": ... }` instead of plain text.
3. Save every question and answer to `history.jsonl`, one JSON object per line.
4. **Stretch:** retry once, after 5 seconds, when you get a `RateLimitError`.
