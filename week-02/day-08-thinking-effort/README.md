# Day 08: Thinking and Effort

Some questions need the model to reason before it answers. Today you learn how to see that reasoning and control how much of it happens.

## What you will learn

- **Chain of thought**: why "think step by step" made older models smarter
- **Adaptive thinking**: modern models decide for themselves when to think and for how long
- **Effort** (`low` → `max`): a single setting that trades speed and cost against quality
- Thinking tokens are billed as output tokens, so more thinking costs more

## Run it

```bash
python run.py day8
```

The script gives a seating puzzle to the model twice, at `low` and `high` effort, and prints the thinking summary, the answer, the time and the tokens for each.

Before looking at the answer below, check each run against every rule yourself. Never trust a model's answer just because it sounds confident.

<details>
<summary>Show the correct answer</summary>

`1=Diya, 2=Chirag, 3=Bina, 4=Aarav`. It is the only arrangement that satisfies all five rules.
</details>

## Walkthrough

1. `thinking: { type: "adaptive", display: "summarized" }` turns thinking on and asks for a readable summary. Without `display`, thinking still happens but the text comes back empty.
2. `output_config: { effort }` sets how hard the model tries.
3. The response `content` now holds `thinking` blocks as well as `text` blocks. We print them separately.

## When to use which effort

| Effort | Good for |
|---|---|
| `low` | Chat, classification, simple extraction, anything where speed matters |
| `medium` | Everyday tasks where you want to save cost without losing much quality |
| `high` (default) | Reasoning, writing, analysis |
| `xhigh` / `max` | Hard coding and multi-step problems where correctness matters most |

## Try it

- Swap in an easy question ("What is 2 + 2?"). Does the model think at all?
- Try `medium` and `max` too. Where does extra effort stop helping?
- Write a harder puzzle with 6 people. Does `low` effort start getting it wrong?

## Homework

Run five puzzles (logic, maths word problems or riddles) at `low` and `high` effort. Record whether each answer was correct, plus tokens and time, in a table in `homework.md`. Which effort would you choose for a homework-help app, and why?
