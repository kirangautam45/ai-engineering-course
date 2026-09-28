// Day 35 — Before-and-after retrieval scores for DocuChat, on the Week 7 test queries
// Run: npm run day35:compare   (needs the lessons ingested: npm run day27)
import { retrieve, hybridRetrieve, ensureIndex } from "../../../lib/vector-store.js";
import { rerank } from "../../../lib/rerank.js";
import { mongo } from "../../../lib/mongo.js";
import { evaluate } from "../../day-31-hybrid-search/evaluate.js";

await ensureIndex();

const setups = {
  "Day 30: vector only": (q) => retrieve(q, { k: 10 }),
  "+ hybrid (Day 31)": (q) => hybridRetrieve(q, { k: 10 }),
  "+ hybrid + rerank (Day 32)": async (q) => rerank(q, await hybridRetrieve(q, { k: 20 }), { top: 10 }),
};

console.log("Setup                          hit@1   hit@3   MRR");
for (const [name, search] of Object.entries(setups)) {
  const { all } = await evaluate(search);
  console.log(`${name.padEnd(30)} ${`${all.hit1}/${all.total}`.padEnd(7)} ${`${all.hit3}/${all.total}`.padEnd(7)} ${all.mrr.toFixed(2)}`);
}
await mongo.close();
