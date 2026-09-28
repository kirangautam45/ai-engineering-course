// Day 24 (part 2) — Search lesson chunks with MongoDB Atlas Vector Search.
// Run: npm run day24 -- "how do I stream to the browser?"
//      npm run day24 -- "how do I stream to the browser?" --week week-01
import { embed } from "../../lib/embeddings.js";
import { mongo, db } from "../../lib/mongo.js";

const args = process.argv.slice(2);
const weekIndex = args.indexOf("--week");
const week = weekIndex !== -1 ? args.splice(weekIndex, 2)[1] : null;
const query = args.join(" ");
if (!query) throw new Error('Usage: npm run day24 -- "your question" [--week week-02]');

const [queryVector] = await embed(query);

const results = await db
  .collection("lesson_chunks")
  .aggregate([
    {
      $vectorSearch: {
        index: "lesson_vector_index",
        path: "embedding",
        queryVector,
        numCandidates: 100, // how many close vectors to consider (more = more accurate, slower)
        limit: 5, // how many to return
        ...(week && { filter: { week } }), // only works on fields declared as "filter" in the index
      },
    },
    // Return just what we need, plus the similarity score
    { $project: { _id: 0, title: 1, file: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
  ])
  .toArray();

console.log(`🔎 "${query}"${week ? ` (only ${week})` : ""}\n`);
for (const r of results) {
  console.log(`${r.score.toFixed(3)}  ${r.title}  (${r.file})`);
  console.log(`       "${r.text.slice(0, 140)}..."\n`);
}
await mongo.close();
