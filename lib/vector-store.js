// A small vector store on MongoDB Atlas: add documents, remove them, and retrieve the chunks
// closest to a question. Used by Days 27–30.
import { createHash } from "node:crypto";
import { embed, DIMENSIONS, EMBEDDING_MODEL } from "./embeddings.js";
import { chunkBySize } from "./chunking.js";
import { db, waitForSearchIndex } from "./mongo.js";

export const chunks = db.collection("rag_chunks");
const INDEX_NAME = "rag_vector_index";

// Create the vector index once. "source" is a filter field so we can search inside one document.
export async function ensureIndex() {
  const existing = await chunks.listSearchIndexes(INDEX_NAME).toArray();
  if (existing.length === 0) {
    await db.createCollection("rag_chunks").catch(() => {}); // index needs the collection to exist
    await chunks.createSearchIndex({
      name: INDEX_NAME,
      type: "vectorSearch",
      definition: {
        fields: [
          { type: "vector", path: "embedding", numDimensions: DIMENSIONS, similarity: "cosine" },
          { type: "filter", path: "source" },
        ],
      },
    });
  }
  await waitForSearchIndex(chunks, INDEX_NAME);
}

// A fingerprint of the content: if it hasn't changed, we don't need to embed it again
const hashOf = (pages) => createHash("sha256").update(JSON.stringify(pages)).digest("hex");

// Add or update one document. pages: [{ page, text }] from lib/loaders.js.
// Returns "unchanged", "added" or "updated".
export async function upsertDocument(source, pages) {
  const hash = hashOf(pages);
  const existing = await chunks.findOne({ source }, { projection: { hash: 1 } });
  if (existing?.hash === hash) return "unchanged";

  const docChunks = pages.flatMap(({ page, text }) =>
    chunkBySize(text, { size: 80, overlap: 20 }).map((chunk) => ({ source, page, text: chunk.text })),
  );
  for (let i = 0; i < docChunks.length; i += 32) {
    const batch = docChunks.slice(i, i + 32);
    const vectors = await embed(batch.map((c) => c.text));
    batch.forEach((chunk, j) => Object.assign(chunk, { embedding: vectors[j] }));
  }

  // Replace the old version's chunks with the new ones
  const now = new Date();
  await chunks.deleteMany({ source });
  await chunks.insertMany(
    docChunks.map((chunk, i) => ({ ...chunk, chunkIndex: i, hash, embeddingModel: EMBEDDING_MODEL, updatedAt: now })),
  );
  return existing ? "updated" : "added";
}

export async function removeDocument(source) {
  const { deletedCount } = await chunks.deleteMany({ source });
  return deletedCount;
}

// One row per document: its name, number of chunks and pages, and when it was last updated
export async function listDocuments() {
  return chunks
    .aggregate([
      { $group: { _id: "$source", chunks: { $sum: 1 }, pages: { $max: "$page" }, updatedAt: { $max: "$updatedAt" } } },
      { $project: { _id: 0, source: "$_id", chunks: 1, pages: 1, updatedAt: 1 } },
      { $sort: { source: 1 } },
    ])
    .toArray();
}

// Find the k chunks closest in meaning to the question. Optionally only inside one source.
export async function retrieve(question, { k = 5, source } = {}) {
  const [queryVector] = await embed(question);
  return chunks
    .aggregate([
      {
        $vectorSearch: {
          index: INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates: k * 20,
          limit: k,
          ...(source && { filter: { source } }),
        },
      },
      { $project: { _id: 0, source: 1, page: 1, chunkIndex: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
    ])
    .toArray();
}
