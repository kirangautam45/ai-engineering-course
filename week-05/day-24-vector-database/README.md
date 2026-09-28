# Day 24: Vector Databases

Looping over every vector in JavaScript is fine for 100 chunks. For a million it's far too slow. A **vector database** stores embeddings and finds the nearest ones quickly. You already know MongoDB, and Atlas has vector search built in.

## What you will learn

- What a vector index does: **approximate nearest-neighbour (ANN)** search
- Creating a **vector search index** in MongoDB Atlas
- Querying it with the `$vectorSearch` aggregation stage
- **Filtering** by metadata, e.g. only chunks from Week 2
- `numCandidates` vs `limit`: the speed/accuracy trade-off

## Setup

Vector search needs **MongoDB Atlas**, not a plain local MongoDB. Use either:

- **A free Atlas cluster** (M0), the same one you used in the MERN course. Put its connection string in `.env` as `MONGODB_URI`, with a database name, e.g. `...mongodb.net/ai-course`.
- **Atlas on your own computer with Docker**:

  ```bash
  docker run -d --name atlas-local -p 27017:27017 mongodb/mongodb-atlas-local
  ```

  Then use `MONGODB_URI=mongodb://localhost:27017/ai-course?directConnection=true`.

## Run it

```bash
npm run day24:setup
npm run day24 -- "how do I stream answers to the browser?"
npm run day24 -- "how do I stream answers to the browser?" --week week-01
```

`setup` chunks and embeds every lesson, saves the chunks to the `lesson_chunks` collection and creates the index. Run it again whenever lessons change.

## Walkthrough

**[`setup.js`](setup.js)**

1. Each chunk is saved as a normal document: `{ file, title, week, chunkIndex, text, embedding, embeddingModel }`. The metadata is what lets you show sources and filter results.
2. `createSearchIndex()` defines the index:

   ```js
   fields: [
     { type: "vector", path: "embedding", numDimensions: 384, similarity: "cosine" },
     { type: "filter", path: "week" },
   ]
   ```

   `numDimensions` must match the embedding model exactly. `week` is declared as a filter field so searches can narrow by it.
3. The index is built in the background, so `waitForSearchIndex()` in [`lib/mongo.js`](../../lib/mongo.js) waits until it's `queryable`.

**[`search.js`](search.js)**

```js
{ $vectorSearch: { index, path: "embedding", queryVector, numCandidates: 100, limit: 5, filter: { week } } }
```

- `numCandidates`: how many nearby vectors the index looks at. More is more accurate but slower. A common rule is 10–20 × `limit`.
- `limit`: how many results to return.
- `filter`: only fields declared as `filter` in the index can be used here.
- `{ $meta: "vectorSearchScore" }` gives the score. With `cosine`, Atlas rescales it to 0–1, so it won't match Day 21's numbers exactly.

## Search indexes update in the background

After you insert or change a document, the vector index catches up a moment later (usually within a second or two). `find()` sees the change at once; `$vectorSearch` may not yet. You'll run into this on Day 25.

## Why "approximate"?

An exact search compares the question with **every** vector. A vector index organizes vectors into a graph of neighbours and only explores the promising part. It's much faster, and very occasionally misses the true closest match. For search, that trade is almost always worth it.

## Try it

- Search with `--week week-04` for "streaming". What does the filter do to the results?
- Set `numCandidates` to 5 and `limit` to 5. Do the results change?
- Look at `lesson_chunks` in Atlas (or MongoDB Compass). How big is one document? Why?

## Homework

Add a `--lesson day-12` filter. You'll need to store a `day` field on each chunk, add it to the index as a filter field, and rebuild.
