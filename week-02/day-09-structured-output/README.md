# Day 09: Structured Output (JSON You Can Trust)

Text is great for humans, but your code needs **data**. Today you get output that always matches a schema, so you can save it to a database or send it to a front end without guessing.

## What you will learn

- Why "reply in JSON" in the prompt isn't enough: extra text, missing fields, wrong types
- Defining the shape you want with a **Pydantic** model
- `client.messages.parse(output_format=...)`: the output is guaranteed to match the model
- Handling "not mentioned" data with `| None` instead of letting the model invent it

## Run it

```bash
python run.py day9
```

A messy job posting (emojis, abbreviations, "40k–60k") becomes a clean object with numbers, arrays and enums.

## Walkthrough

1. `Job` is a Pydantic model: a class with typed fields. `Literal["onsite", "hybrid", ...]` limits a field to fixed values, and `Field(description=...)` gives the model a hint about a field.
2. `client.messages.parse(output_format=Job)` turns the class into the JSON schema the API expects, and the answer back into a `Job` object.
3. `response.parsed_output` is a real Python object: `job.title`, `job.salary.min`. Your editor can autocomplete it.
4. If the answer somehow doesn't fit (for example, `max_tokens` cut it off mid-JSON), `parse()` raises a `ValidationError`, which we catch with a clear message.

## Try it

- Remove the salary line from the posting. Is `salary` now `None`?
- Add a `deadline` field. How does the model handle "Asoj 30" (a Nepali calendar date)?
- Paste a real job posting from a job site and check every field.

## Homework

Build an extractor for **college notices**: `{ title, department, date, audience, action_required, links[] }`. Test it on five real notices and note any field it gets wrong.
