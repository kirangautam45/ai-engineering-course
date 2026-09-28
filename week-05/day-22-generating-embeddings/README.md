# Day 22: Generating and Storing Embeddings

Yesterday you embedded a few sentences. Today you build a real (small) search index: every lesson in this course, embedded once, saved to a file, and searchable by meaning.

## What you will learn

- **Build once, search many times**: embed your documents ahead of time and save the vectors
- **Batching**: embedding several texts per call is much faster
- Why you must use the **same model** for documents and questions
- Local models vs hosted embedding APIs, and how to choose
- The limit that motivates tomorrow's lesson: models only read so much text

## Run it

```bash
npm run day22 -- build
npm run day22 -- search "how do I stop a stream when the user leaves?"
npm run day22 -- search "keeping my API key secret"
npm run day22 -- search "नेपालीमा अनुवाद"
```

`build` writes `index.json` (ignored by git). It's plain JSON: open it and look at what a search index really is.

## Walkthrough

1. **`build`** finds every `week-*/day-*/README.md`, embeds them in batches of 8 and saves `{ file, title, text, embedding }` for each.
2. **The model name is saved in the index.** Vectors from different models live in different "spaces" and can't be compared. `search` refuses to use an index built with another model.
3. **`search`** embeds your question and ranks every lesson by cosine similarity. For a few hundred documents, looping over all of them is fast enough. On Day 24 you'll use a database for millions.

## The problem you'll notice

Search for something that's only mentioned near the **end** of a README. It probably won't be found.

This model reads at most **128 tokens** (about 80–100 words) per text. Everything after that is silently ignored, so each README's embedding only represents its first paragraph or so. Tomorrow you'll fix this by splitting documents into **chunks**.

## Local model or hosted API?

| | Local (this course) | Hosted API (e.g. Voyage AI) |
|---|---|---|
| Cost | Free | Pay per token (usually there's a free allowance) |
| Setup | Nothing: it downloads itself | API key and a network call |
| Quality | Good | Better, especially for long texts and specialist topics |
| Max text length | 128 tokens | Thousands of tokens |
| Privacy | Text never leaves your computer | Text is sent to the provider |

Claude doesn't make embeddings itself. For production apps, Anthropic recommends [Voyage AI](https://docs.voyageai.com/). Hosted models often take an `input_type` of `"document"` or `"query"`, because questions and answers are phrased differently. To switch, you would only change `embed()` in [`lib/embeddings.js`](../../lib/embeddings.js), then rebuild the index.

## Try it

- Search in Nepali or Romanized Nepali. Which lessons come up?
- Time `build` with `BATCH_SIZE = 1` and with `BATCH_SIZE = 16`. What's the difference?
- Change `EMBEDDING_MODEL` in `lib/embeddings.js` and run `search` without rebuilding. What happens?

## Homework

Add a `stats` command that prints how many documents are in the index, the vector size, and the two most similar lessons in the whole course.
