// Day 31 — Hybrid search: vector search + keyword search, merged with reciprocal rank fusion
// Run: npm run day31                        (compares the three on the test queries)
//      npm run day31 -- "citations_delta"    (shows each method's results for one query)
// Needs the lessons ingested first: npm run day27
import { retrieve, keywordSearch, hybridRetrieve, ensureIndex } from "../../lib/vector-store.js";
import { mongo } from "../../lib/mongo.js";
import { evaluate, printSummary } from "./evaluate.js";

await ensureIndex(); // creates the new keyword index on first run
const query = process.argv.slice(2).join(" ");

const methods = {
  "Vector search (meaning)": (q) => retrieve(q, { k: 10 }),
  "Keyword search (exact words)": (q) => keywordSearch(q, { k: 10 }),
  "Hybrid (both, fused)": (q) => hybridRetrieve(q, { k: 10 }),
};

if (query) {
  for (const [name, search] of Object.entries(methods)) {
    const results = await search(query);
    console.log(`\n${name}:`);
    for (const r of results.slice(0, 3)) console.log(`  ${r.score.toFixed(3)}  ${r.source} (chunk ${r.chunkIndex})`);
    if (results.length === 0) console.log("  (no results)");
  }
} else {
  for (const [name, search] of Object.entries(methods)) printSummary(name, await evaluate(search));
}
await mongo.close();
