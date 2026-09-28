// Day 24 (part 1) — Load the course's lesson chunks into MongoDB and create a vector index.
// Run: npm run day24:setup
import { readFileSync, globSync } from "node:fs";
import { embed, DIMENSIONS, EMBEDDING_MODEL } from "../../lib/embeddings.js";
import { chunkBySize } from "../../lib/chunking.js";
import { mongo, db, waitForSearchIndex } from "./db.js";

const collection = db.collection("lesson_chunks");
const INDEX_NAME = "lesson_vector_index";

// 1. Chunk every lesson README (fixed size won on Day 23) and keep useful metadata
const chunks = globSync("week-*/day-*/README.md")
  .sort()
  .flatMap((file) => {
    const text = readFileSync(file, "utf8");
    const title = text.match(/^# (.+)/m)?.[1] ?? file;
    const week = file.split("/")[0]; // e.g. "week-02"
    return chunkBySize(text).map((chunk, i) => ({ file, title, week, chunkIndex: i, text: chunk.text }));
  });

// 2. Embed them in batches
console.log(`Embedding ${chunks.length} chunks...`);
for (let i = 0; i < chunks.length; i += 16) {
  const batch = chunks.slice(i, i + 16);
  const vectors = await embed(batch.map((c) => c.text));
  batch.forEach((chunk, j) => {
    chunk.embedding = vectors[j];
    chunk.embeddingModel = EMBEDDING_MODEL;
  });
}

// 3. Replace the old data. (Day 27 shows how to update only the files that changed.)
await collection.deleteMany({});
await collection.insertMany(chunks);
console.log(`Saved ${chunks.length} chunks to the "lesson_chunks" collection.`);

// 4. Create the vector search index once. "filter" fields can be used to narrow a search.
const existing = await collection.listSearchIndexes(INDEX_NAME).toArray();
if (existing.length === 0) {
  await collection.createSearchIndex({
    name: INDEX_NAME,
    type: "vectorSearch",
    definition: {
      fields: [
        { type: "vector", path: "embedding", numDimensions: DIMENSIONS, similarity: "cosine" },
        { type: "filter", path: "week" },
      ],
    },
  });
  console.log(`Created the "${INDEX_NAME}" vector index.`);
}
await waitForSearchIndex(collection, INDEX_NAME);
console.log("Ready! Try: npm run day24 -- \"how do I stream to the browser?\"");
await mongo.close();
