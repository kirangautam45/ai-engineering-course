# Day 26: How RAG Works

Models only know what was in their training data. They don't know your college's rules, your company's documents, or this course. **Retrieval-augmented generation (RAG)** fixes that: find the relevant text, put it in the prompt, and let the model answer from it.

## What you will learn

- The three steps: **R**etrieve, **A**ugment, **G**enerate
- Why RAG beats "just ask the model" for private or recent information
- RAG vs long context vs fine-tuning: when to use each
- Why the prompt says "use only the documents" and "say you don't know"

## Run it

```bash
python run.py day26
python run.py day26 "What does the Day 19 lesson say is the real protection against prompt injection?"
python run.py day26 "What is the capital of Australia?"
```

The script asks the same question twice: once on its own, and once with the 4 most relevant chunks of this course's lessons added to the prompt.

## The pipeline

```
                  ┌─────────────┐
 question ───────▶│  embed it   │
                  └──────┬──────┘
                         ▼
 lesson chunks ──▶ find the 4 closest chunks          ← Retrieve (Week 5)
                         ▼
          prompt = documents + rules + question        ← Augment
                         ▼
                   Claude answers                       ← Generate
```

It's Week 5's search with one more step at the end.

## Walkthrough

1. **Retrieve.** Every lesson README is chunked (Day 23), embedded, and compared with the question. The top 4 chunks win.
2. **Augment.** The chunks go into `<document>` tags with their source. The instructions tell the model to answer **only** from them, and to say "I don't know" if the answer isn't there.
3. **Generate.** The same model is called with and without the documents, in parallel. Compare the answers and the input tokens.

## What to notice

- **Retrieval can fail.** Ask "Which free APIs does the Day 17 lesson use?" and the Day 17 lesson may not be retrieved at all: the chunks that describe the APIs don't contain the words "Day 17", and our small local model doesn't connect them. When a RAG answer is wrong, check what was retrieved **before** blaming the model. (Week 7 improves retrieval.)
- **Without RAG** the model can't know what's in this course. A good model says so, while a weaker one may make up a believable answer ("hallucinate").
- **With RAG** the answer is specific, and you can check it against the retrieved chunks.
- **For a general-knowledge question**, the documents don't help, and the "only use the documents" rule makes the model say it doesn't know. Is that what you want? It depends on your app.

## RAG, long context or fine-tuning?

| Approach | How it works | Use it when |
|---|---|---|
| **RAG** | Retrieve a few relevant chunks per question | Lots of documents, content changes often, you need sources |
| **Long context** | Put the whole document in the prompt | One or a few documents that fit in the context window (use prompt caching, Day 34) |
| **Fine-tuning** | Train the model further on your data | Teaching a *style* or format, not facts. It's a poor way to add knowledge |

## Try it

- Change `TOP_K` to 1 and to 10. How do the answer and the token count change?
- Ask about something from Week 5. Is the right lesson retrieved?
- Remove the "say you don't know" instruction and ask about something that isn't in the course.

## Homework

Draw the RAG pipeline for a **college FAQ bot**: where do the documents come from, how often do they change, who can see which documents, and what should the bot say when it doesn't know?
