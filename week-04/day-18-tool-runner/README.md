# Day 18: The Tool Runner

On Days 16 and 17 you wrote the tool loop by hand: call the model, check `stop_reason`, run the tools, send the results, repeat. That's worth understanding once. Now let the SDK do it for you.

## What you will learn

- Defining a tool as **one decorated function** with `@beta_tool`: the type hints become the schema, the docstring becomes the description
- `client.beta.messages.tool_runner()`: the SDK runs the loop, including errors
- `max_iterations`: a safety limit so a confused model can't loop forever (or spend all your credit)
- Watching each step by looping over the runner
- When you need an "agent" at all, and when one API call is enough

## Run it

```bash
python run.py day18
python run.py day18 "I'm flying from Delhi to Kathmandu with 20,000 INR. How much is that in NPR, and what's the weather like when I land?"
```

## Day 17 vs Day 18

| | Day 17 (manual loop) | Day 18 (tool runner) |
|---|---|---|
| Tool definition | JSON schema + separate `handlers` map | One `@beta_tool` function |
| Descriptions | Written in the JSON schema | The docstring (`Args:` section) |
| Input checking | None: you trust the model's input | Pydantic checks the type hints before your function runs |
| The loop | ~20 lines you write | Built in |
| Several calls at once | You run them in threads | Run one after another (simpler, a bit slower) |
| Errors | You catch them and set `is_error` | A raised exception becomes an `is_error` result automatically |

The same `get_weather` and `convert_currency` functions from Day 17 are reused unchanged.

```python
@beta_tool
def convert_currency(
    amount: Annotated[float, Field(gt=0)],          # must be more than 0
    from_currency: Annotated[str, Field(min_length=3, max_length=3)],
    to_currency: Annotated[str, Field(min_length=3, max_length=3)],
) -> str:
    """Convert an amount of money between currencies using today's exchange rate.

    Args:
        amount: How much money (more than 0).
        from_currency: 3-letter currency code, e.g. USD.
        to_currency: 3-letter currency code, e.g. NPR.
    """
```

(The parameters are `from_currency`/`to_currency`, not `from`/`to`: `from` is a reserved word in Python.)

When a tool raises an error, the SDK also prints it (with a traceback) to your terminal. That's just logging: the model still receives the error as an `is_error` result and carries on.

## When do you need an agent?

A loop where the model decides which tools to call is an **agent**. Agents are powerful but slower, more expensive and harder to predict. Before building one, ask:

1. **Is the task open-ended?** "Plan my trip" needs several decisions. "Classify this email" doesn't; use one call.
2. **Is it worth the cost?** Each loop turn is a full API call.
3. **Can mistakes be caught?** An agent that only reads data is low-risk. One that sends emails or deletes things needs human confirmation (Day 19).

## Try it

- Set `max_iterations=1`. What does the final message look like?
- Ask for a negative amount ("convert -50 USD"). What does `Field(gt=0)` do?
- Add the `get_forecast` tool from your Day 17 homework as a `@beta_tool`.

## Homework

Rewrite your Day 16 calculator with `@beta_tool` and the tool runner. How many lines shorter is it?
