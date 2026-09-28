# Day 18: The Tool Runner

On Days 16 and 17 you wrote the tool loop by hand: call the model, check `stop_reason`, run the tools, send the results, repeat. That's worth understanding once. Now let the SDK do it for you.

## What you will learn

- Defining a tool as **one object** with `betaZodTool`: description, Zod schema and `run` function together
- `client.beta.messages.toolRunner()`: the SDK runs the loop, including parallel calls and errors
- `max_iterations`: a safety limit so a confused model can't loop forever (or spend all your credit)
- Watching each step by looping over the runner
- When you need an "agent" at all, and when one API call is enough

## Run it

```bash
npm run day18
npm run day18 -- "I'm flying from Delhi to Kathmandu with 20,000 INR. How much is that in NPR, and what's the weather like when I land?"
```

## Day 17 vs Day 18

| | Day 17 (manual loop) | Day 18 (tool runner) |
|---|---|---|
| Tool definition | JSON schema + separate `handlers` map | One `betaZodTool` object |
| Input checking | None: you trust the model's input | Zod checks it before `run` is called |
| The loop | ~20 lines you write | Built in |
| Parallel calls | You write `Promise.all` | Built in |
| Errors | You catch them and set `is_error` | A thrown error becomes an `is_error` result automatically |

The same `getWeather` and `convertCurrency` functions from Day 17 are reused unchanged.

## When do you need an agent?

A loop where the model decides which tools to call is an **agent**. Agents are powerful but slower, more expensive and harder to predict. Before building one, ask:

1. **Is the task open-ended?** "Plan my trip" needs several decisions. "Classify this email" doesn't; use one call.
2. **Is it worth the cost?** Each loop turn is a full API call.
3. **Can mistakes be caught?** An agent that only reads data is low-risk. One that sends emails or deletes things needs human confirmation (Day 19).

## Try it

- Set `max_iterations: 1`. What does the final message look like?
- Ask for a negative amount ("convert -50 USD"). What does the Zod schema do?
- Add the `get_forecast` tool from your Day 17 homework as a `betaZodTool`.

## Homework

Rewrite your Day 16 calculator with `betaZodTool` and the tool runner. How many lines shorter is it?
