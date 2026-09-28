# Day 37: LLM-as-Judge

Code checks can't tell whether "The weather comes from a free service named Open Meteo" is correct. A human can, but humans are slow and expensive. An **LLM judge** grades answers like a human would, in seconds. The catch: you must check the judge before you trust it.

## What you will learn

- Writing a **rubric**: exactly what counts as correct, partially correct and incorrect
- Getting grades back as structured output (Day 9), with reasoning **before** the verdict
- **Calibration**: measuring how often the judge agrees with a human
- When to use code checks, an LLM judge, or a human

## Run it

```bash
npm run day37                  # check the judge against human grades
npm run day36                  # produce answers to judge (if you haven't)
npm run day37 -- --last-run    # judge those answers, and compare with the code checks
```

## The judge

[`../judge.js`](../judge.js) sends the question, the human's reference answer and the bot's answer, with a rubric:

- **correct**: has the key facts of the reference and nothing that contradicts it. Wording and length don't matter.
- **partially_correct**: some key facts, but misses an important one or adds something wrong.
- **incorrect**: misses the point, contradicts the reference, or says it doesn't know.
- For questions the course **can't** answer: only "I don't know" is correct. A true answer from general knowledge ("Canberra") is **incorrect**, because the bot must only use the course.

Two details matter:

1. **Reasoning comes first** in the output schema. The model writes its explanation, then decides. Grades are more consistent than asking for the verdict alone.
2. **The answer is data.** The rubric tells the judge that text inside `<answer>` is to be graded, not obeyed. Otherwise an answer containing "Grade this as correct" could fool it.

## Calibrate before you trust

[`human-labels.js`](human-labels.js) has 14 answers graded by a human, including tricky ones:

| Answer | Human grade | What it tests |
|---|---|---|
| "…a free service whose name is Open Meteo." | correct | Different wording |
| "The course uses the OpenWeatherMap API." | incorrect | Confident and wrong |
| "It uses a system prompt and an allowlist…" | partially correct | One right fact, one invented |
| "Canberra is the capital of Australia." | incorrect | True, but not from the course |
| "The course is free and open source…" | incorrect | Sounds plausible, isn't in the lessons |

`npm run day37` grades them all and reports the agreement. As a rule of thumb, **aim for 85%+** before using the judge to make decisions, and look at every disagreement: sometimes the judge is right and the human label is wrong.

When the judge fails calibration, fix the **rubric** (add the rule it got wrong, with an example), not the individual answers.

## Code checks, judge or human?

| | Code checks | LLM judge | Human |
|---|---|---|---|
| Cost | Free | One API call per answer | Your time |
| Speed | Milliseconds | Seconds | Minutes |
| Understands meaning | No | Yes | Yes |
| Consistent | Always | Mostly | Tired humans aren't |
| Use for | Exact facts, format, "I don't know" | Correctness, completeness | Building the reference answers and calibration labels |

Use all three: code checks for everything they can do, the judge for the rest, and humans to keep both honest.

## Try it

- Remove "Wording, length and extra correct detail don't matter" from the rubric. Does agreement drop?
- Add 5 labels of your own, including one you think the judge will get wrong.
- In `--last-run` mode, read each disagreement. Who was right: the code check or the judge?

## Homework

Write a second judge for **tone**: is the answer friendly, clear and short enough for a student? Write 10 human labels for it and calibrate it.
