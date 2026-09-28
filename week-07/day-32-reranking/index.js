// Day 32 — Reranking: retrieve 20 candidates fast, then reorder them with a cross-encoder
// Run: npm run day32                                   (compares with and without reranking)
//      npm run day32 -- "stop paying for tokens when the user leaves the page"
// Needs the lessons ingested first: npm run day27
import { hybridRetrieve, ensureIndex } from "../../lib/vector-store.js";
import { rerank, RERANK_MODEL } from "../../lib/rerank.js";
import { mongo } from "../../lib/mongo.js";
import { evaluate, printSummary } from "../day-31-hybrid-search/evaluate.js";

await ensureIndex();
const CANDIDATES = 20;
const query = process.argv.slice(2).join(" ");

// Stage 1: fast and broad. Stage 2: slow and precise, but only on 20 chunks.
const withRerank = async (q) => rerank(q, await hybridRetrieve(q, { k: CANDIDATES }), { top: 10 });

if (query) {
  const candidates = await hybridRetrieve(query, { k: CANDIDATES });
  const started = Date.now();
  const reranked = await rerank(query, candidates, { top: 5 });
  console.log(`🔎 "${query}"\n\nBefore reranking (hybrid order):`);
  candidates.slice(0, 5).forEach((c, i) => console.log(`  ${i + 1}. ${c.source} (chunk ${c.chunkIndex})`));
  console.log(`\nAfter reranking with ${RERANK_MODEL} (${Date.now() - started} ms for ${candidates.length} chunks):`);
  reranked.forEach((c, i) => {
    const was = candidates.findIndex((x) => x.source === c.source && x.chunkIndex === c.chunkIndex) + 1;
    console.log(`  ${i + 1}. ${c.source} (chunk ${c.chunkIndex})  score ${c.rerankScore.toFixed(2)}, was #${was}`);
  });
} else {
  printSummary("Hybrid only", await evaluate((q) => hybridRetrieve(q, { k: 10 })));
  printSummary(`Hybrid + rerank (${RERANK_MODEL})`, await evaluate(withRerank));
}
await mongo.close();
