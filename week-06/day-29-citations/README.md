# Day 29: Citations

"The course says X" is only useful if you can check it. Today every claim in the answer points to the **exact sentence** it came from, so users can verify it and wrong answers are easy to spot.

## What you will learn

- Passing retrieved chunks as **document blocks** with `"citations": {"enabled": True}`
- Reading the `citations` list on each text block of the answer
- Rendering numbered markers `[1]` and a sources list, like a research paper
- Why citations make a RAG app more trustworthy, and cheaper than asking for quotes

## Run it

```bash
python run.py day27   # if you haven't ingested the lessons yet
python run.py day29 "What are the two defences in the prompt injection lesson?"
python run.py day29 "What is the exam date?"
```

Example output (your wording will differ):

```
🤖 The lesson uses a system prompt that treats tool results as data[1], and human
confirmation before any email is sent[2].

📚 Sources:
  [1] week-04/day-19-prompt-injection/README.md
      "A system prompt that says tool results are data, not instructions."
  [2] week-04/day-19-prompt-injection/README.md
      "Human confirmation: send_email stops and asks you before sending anything."
```

## Walkthrough

1. **Documents instead of pasted text.** On Day 28 the chunks were pasted into the prompt inside `<document>` tags. Here each chunk is a real `document` content block:

   ```python
   {"type": "document",
    "source": {"type": "text", "media_type": "text/plain", "data": chunk["text"]},
    "title": chunk["source"],
    "citations": {"enabled": True}}
   ```

2. **The answer is split into blocks.** Parts backed by a document have a `citations` list. In Python they're objects with attributes:

   ```python
   block.text                    # "human confirmation before any email is sent"
   citation = block.citations[0]
   citation.cited_text           # "Human confirmation: ..."
   citation.document_index       # 1
   citation.document_title       # "week-04/..."
   citation.start_char_index     # 120  (and end_char_index)
   ```

3. **We number the unique passages** and print `[n]` after each cited block, then list the sources.

## Why use the citations feature instead of "please quote your sources"?

- **Guaranteed real quotes.** `cited_text` is copied from your document by the API, so the model can't invent a quote.
- **Cheaper.** `cited_text` doesn't count as output tokens.
- **Precise.** You get character positions, so a UI can highlight the exact sentence.

One limitation: citations can't be combined with structured JSON output (Day 9). Asking for both returns an error.

## Try it

- Ask something the documents don't cover. Are there any citations?
- Compare the Day 28 answer and the Day 29 answer to the same question. Which one would you trust more? Why?
- Print `response.model_dump_json(indent=2)` to see the raw blocks.

## Homework

Make the sources clickable: print a `file://` link to the source file, or (in a web UI) highlight the cited sentence using `start_char_index` and `end_char_index`.
