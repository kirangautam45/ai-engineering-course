# Day 09: Structured Output (JSON You Can Trust)

Text is great for humans, but your code needs **data**. Today you get output that always matches a schema, so you can save it to a database or send it to a front end without guessing.

## What you will learn

- Why "reply in JSON" in the prompt isn't enough: extra text, missing fields, wrong types
- Defining the shape you want with a **Zod** schema
- `output_config.format` + `client.messages.parse()`: the output is guaranteed to match the schema
- Handling "not mentioned" data with `.nullable()` instead of letting the model invent it

## Run it

```bash
npm run day9
```

A messy job posting (emojis, abbreviations, "40k–60k") becomes a clean object with numbers, arrays and enums.

## Walkthrough

1. `Job` is a Zod schema. `z.enum([...])` limits a field to fixed values, and `.describe()` gives the model a hint about a field.
2. `zodOutputFormat(Job)` turns the schema into the JSON schema the API expects.
3. `client.messages.parse()` works like `messages.create()`, but also parses the answer into `response.parsed_output`.
4. We still check that `parsed_output` isn't `null`, for example when the answer was cut off by `max_tokens`.

## Try it

- Remove the salary line from the posting. Is `salary` now `null`?
- Add a `deadline` field. How does the model handle "Asoj 30" (a Nepali calendar date)?
- Paste a real job posting from a job site and check every field.

## Homework

Build an extractor for **college notices**: `{ title, department, date, audience, action_required, links[] }`. Test it on five real notices and note any field it gets wrong.
