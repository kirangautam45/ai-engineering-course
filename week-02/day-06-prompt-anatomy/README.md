# Day 06: Anatomy of a Good Prompt

The same model gives very different answers depending on how you ask. Today you learn what makes a prompt clear.

## What you will learn

- The **"new employee" test**: would a smart person who just joined your team understand what you want?
- The five parts of a strong prompt: **role**, **task**, **context**, **constraints** and **output format**
- Why explaining the **reason** behind a rule works better than the bare rule
- How to compare prompts on the same input instead of guessing

## Run it

```bash
python run.py day6
```

The script sends one customer review with three prompts and prints all three answers.

| Prompt | What it adds |
|---|---|
| 1. Vague | Nothing: "Summarize this" |
| 2. Specific | A format (2 bullets) and what to look for |
| 3. Full anatomy | Who the reader is, why they need it, an exact format, length limits and reasons |

## Walkthrough

1. The review is wrapped in `<review>` tags in prompt 3 so the model can tell the data apart from the instructions. More on this tomorrow.
2. Every rule in prompt 3 comes with a reason: "because this goes straight into a dashboard". The model uses the reason to handle cases the rule doesn't cover.
3. `asyncio.gather` runs the three requests at the same time, so you wait for the slowest one instead of all three in a row. It needs the SDK's async client (`async_client`) and `async`/`await` functions: a pattern you'll use again in Week 3.

## Try it

- Remove the reasons from prompt 3 (keep the rules). Does the output change?
- Replace the review with a very happy one. Which prompt handles it best?
- Add a fourth prompt that returns the result in Nepali for a local manager.

## Homework

Pick three prompts you actually use (for homework help, emails or code). Rewrite each one with all five parts and save the before and after versions, plus one sentence on what improved, in `homework.md`.
