# Day 16: Your First Tool — a Calculator

A model can only produce text. It can't browse the web, read your database or even do exact arithmetic reliably. **Tools** fix that: you describe a function, the model asks you to run it, and you send back the result.

## What you will learn

- The three parts of a tool: a **description** (for the model), an **implementation** (your code) and **the loop** that connects them
- What `stop_reason: "tool_use"` means
- How `tool_use` and `tool_result` blocks are linked by an `id`
- Returning errors with `is_error: true` so the model can recover

## Run it

```bash
npm run day16
npm run day16 -- "If 3 friends split a bill of NPR 2,450 and add a 10% tip, how much does each pay?"
```

You'll see every tool call as it happens (the model may split the steps differently):

```
🔧 calculate({"a":45999,"b":0.18,"operation":"multiply"}) = 8279.82
🔧 calculate({"a":45999,"b":8279.82,"operation":"add"}) = 54278.82
🤖 The VAT is NPR 8,279.82, so the total is NPR 54,278.82.
```

## How the loop works

```
Your code ── question ─────────────────────────▶ Model
Your code ◀─ tool_use: calculate(45999 × 0.18) ── Model    stop_reason: "tool_use"
   runs calculate() → 8279.82
Your code ── tool_result: 8279.82 ─────────────▶ Model
Your code ◀─ tool_use: calculate(45999 + 8279.82) Model    stop_reason: "tool_use"
   runs calculate() → 54278.82
Your code ── tool_result: 54278.82 ────────────▶ Model
Your code ◀─ "The total is NPR 54,278.82" ─────── Model    stop_reason: "end_turn"
```

**The model never runs your code.** It only asks. Your program decides whether to run it, which is what keeps tools safe (more on Day 19).

## Walkthrough

1. **`tools`** describes `calculate` with a JSON schema. The `description` matters a lot: it tells the model *when* to use the tool.
2. **`calculate()`** is plain JavaScript. We don't use `eval()` on text from the model, because that would let it run any code on your machine.
3. **The loop** keeps going while `stop_reason` is `"tool_use"`. It's capped at 10 turns so a confused model can't loop forever.
4. **Each `tool_result`** carries the `tool_use_id` of the request it answers.
5. **Errors** go back with `is_error: true`. Ask "What is 5 divided by 0?" and watch the model explain the problem instead of crashing.

## Try it

- Remove "instead of calculating in your head" from the description. Does the model still use the tool for simple sums?
- Ask something with no maths ("What is the capital of Nepal?"). Is the tool used?
- Add a `power` operation and ask for compound interest over 5 years.

## Homework

Add a second tool, `get_date`, that returns today's date. Then ask "How many days until Dashain?" (tell the model the date of Dashain in your question).
