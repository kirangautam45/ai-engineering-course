# Day 17: Multiple Tools, Parallel Calls and Errors

Real assistants have several tools. Today you give the model live **weather** and **exchange rates**, and handle what happens when a tool fails.

## What you will learn

- Routing tool calls to the right function with a `handlers` map
- **Parallel tool calls**: the model can ask for several tools in one turn
- Running them at the same time with a `ThreadPoolExecutor`, and returning **all results in one message**
- Returning errors so the model can recover ("No city called 'Pokhra' was found")
- Writing tool descriptions that guide the model

## Run it

```bash
python run.py day17
python run.py day17 "Is it warmer in Biratnagar or Dharan right now?"
python run.py day17 "What's the weather in Pokhra?"
```

The tools call two free APIs that need no key: [Open-Meteo](https://open-meteo.com) for weather and [ExchangeRate-API](https://www.exchangerate-api.com/docs/free) for currency.

Typical output:

```
Turn 1: the model asked for 3 tool call(s)
  ✅ get_weather({"city": "Kathmandu"})
  ✅ get_weather({"city": "Pokhara"})
  ✅ convert_currency({"amount": 250, "from_currency": "USD", "to_currency": "NPR"})
🤖 Right now Kathmandu is 22°C ...
```

## Walkthrough

1. **[`services.py`](services.py)** holds normal functions that know nothing about AI. You could use them in any app. `fetch_json()` adds a 10-second timeout and turns any network failure into a clear error message the model can pass on.
2. **`handlers`** maps each tool name to its function, so adding a tool is one line.
3. **`ThreadPoolExecutor().map(run_tool, calls)`** runs every requested tool at once, each in its own thread. Three API calls take as long as the slowest one, not all three added up.
4. **One message with every result.** If you send results back one message at a time, the model learns that parallel calls don't work and stops making them.
5. **`is_error: true`** marks a failed call. Try a misspelled city: the model usually retries with the right spelling, or asks you.
6. **Return compact data.** `getWeather` returns 6 fields, not the whole API response. Tool results count as input tokens.

## Try it

- Ask about 5 cities at once. How many turns does it take?
- Change the `get_weather` description to remove "call it several times in the same turn". Does it still call in parallel?
- Ask "Convert 100 dollars to rupees". Which "dollars" and "rupees" does it pick? How could the description help?

## Homework

Add a `get_forecast` tool that returns the next 3 days for a city (Open-Meteo's `daily` parameter). Then ask "Should I carry an umbrella for my trek to Ghandruk this weekend?"
