# Day 01: Your First LLM API Call

Today you send a question to a large language model (LLM) from your own Python code and print the answer.

## What you will learn

- What an LLM is: a model that predicts the next piece of text, one token at a time
- What an API key is and why it must never be committed to GitHub
- The shape of a request: `model`, `max_tokens`, `messages`
- The shape of a response: `content`, `stop_reason`, `usage`

## Setup (once for the whole course)

You need **Python 3.11 or newer** (`python3 --version`). From the repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -e .
cp .env.example .env
```

`pip install -e .` installs the libraries and makes the shared helpers in `ailib/` importable. Activate the virtual environment (`source .venv/bin/activate`) each time you open a new terminal.

Open `.env` and paste your API key from the [Anthropic Console](https://console.anthropic.com/).

## Run it

```bash
python run.py day1
python run.py day1 "Explain what an API is in one sentence"
```

## Walkthrough

1. `ailib/claude.py` loads your `.env` file and creates a `client`. Every lesson reuses it.
2. `client.messages.create()` sends one request. `messages` is a list, and today it has a single `user` message.
3. `max_tokens` caps how long the answer can be. If the model hits it, `stop_reason` is `"max_tokens"` and the answer is cut off.
4. The answer lives in `response.content`, which is a **list of blocks**. `text_of()` keeps the `text` blocks and joins them.

## Try it

- Ask the same question three times. Are the answers identical? Why not?
- Set `max_tokens` to `20` and ask for a long story. What happens to `stop_reason`?
- Ask a question about something that happened yesterday. What does the model say, and why?

## Homework

Write `homework.py` that takes a topic from the command line and prints **three quiz questions** about it. Print the token usage at the end.
