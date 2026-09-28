# Day 33: Query Rewriting

In a chat, people don't repeat themselves. "What are the two defences?" is followed by "Which one is enforced in code?". That second question is impossible to search: what is "one"? Today you fix it.

## What you will learn

- Why **follow-up questions** break retrieval
- **Query rewriting**: turn the latest question into a standalone search query using the conversation
- **Multi-query**: search several phrasings of the same question and fuse the results
- Keeping chat history small: store questions and answers, not documents

## Run it

```bash
npm run day27   # if you haven't ingested the lessons yet
npm run day33
npm run day33 -- --multi
```

Try this conversation (the rewritten wording will vary):

```
You: What are the two defences in the prompt injection lesson?
You: Which one is enforced in code?
   🔁 Searching for: "Which prompt injection defence is enforced in code rather than the prompt?"
```

## How it works

```
question ──▶ rewrite with history ──▶ hybrid search ──▶ answer with history + documents
            (only for follow-ups)
```

1. **Rewrite.** If there's history, a small, fast model call (`effort: "low"`, structured output from Day 9) returns `{ query, alternatives }`. The query replaces "it", "that" and "the second one" with what they refer to.
2. **Search** with the rewritten query, using Day 31's hybrid search.
3. **Answer** with the conversation history plus this turn's documents, so the answer can still refer back ("as I said above...").
4. **Save** only the plain question and answer to the history. The documents change every turn and would make the history huge.

## Multi-query

With `--multi`, the rewrite also returns up to 3 alternative phrasings. Each is searched separately, and the lists are merged with reciprocal rank fusion (Day 31). This helps when the user's wording doesn't match the documents' wording. It costs extra searches, but no extra calls to Claude.

## Costs and trade-offs

| | Cost | When it helps |
|---|---|---|
| Rewriting | One small, fast model call per follow-up | Any chat-style RAG app |
| Multi-query | 3–4× the searches | Vague questions, or users who phrase things very differently from your documents |

Skip the rewrite on the first question (there's nothing to resolve) unless you're using multi-query.

## Try it

- Turn off the rewrite (search with the raw question) and ask the follow-up again. What's retrieved?
- Ask a follow-up that changes topic completely. Does the rewrite handle it?
- Compare `--multi` with normal mode on a vague question like "keeping secrets safe".

## Homework

Show the rewritten query in a lighter colour in your Day 30 DocuChat page, so users can see (and correct) what was searched.
