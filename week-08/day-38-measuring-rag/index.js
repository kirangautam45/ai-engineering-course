// Day 38 — Measuring RAG: grade retrieval and generation separately, to know WHAT to fix
// Run: npm run day38                            (all answerable questions + a few unanswerable)
//      npm run day38 -- --retrieval vector      (compare with plain vector search)
// Needs the lessons ingested: npm run day27
import { answerQuestion } from "../../lib/rag.js";
import { mongo } from "../../lib/mongo.js";
import { evalSet } from "../eval-set.js";
import { judge, checkGrounded } from "../judge.js";

const args = process.argv.slice(2);
const retrieval = args.includes("--retrieval") ? args[args.indexOf("--retrieval") + 1] : "hybrid+rerank";
const K = 5;

// Where did it go wrong? Retrieval first, because generation can't use what it never saw.
function diagnose(row) {
  if (row.type === "unanswerable") return row.correct ? "ok" : "made something up";
  if (row.retrievalHit && row.correct) return "ok";
  if (!row.retrievalHit && !row.correct) return "fix RETRIEVAL: right lesson not in top 5";
  if (row.retrievalHit && !row.correct) return "fix GENERATION: had the right chunks, answered badly";
  return "lucky: right answer without the right lesson";
}

console.log(`Retrieval:                     ${retrieval}, top ${K}\n`);
const rows = [];
for (const item of evalSet) {
  const result = await answerQuestion(item.question, { retrieval, k: K });
  const lessons = [...new Set(result.chunks.map((c) => c.source.split("/")[1]))];
  const rank = item.sources ? lessons.findIndex((l) => item.sources.some((s) => l.startsWith(s))) + 1 : 0;
  const [{ verdict }, { grounded, unsupportedClaims }] = await Promise.all([
    judge(item, result.answer),
    checkGrounded(result.answer, result.chunks),
  ]);
  const row = {
    id: item.id,
    type: item.type,
    retrievalHit: rank > 0,
    rank,
    correct: verdict === "correct",
    verdict,
    grounded,
    unsupportedClaims,
    cited: result.citations.length > 0,
  };
  row.diagnosis = diagnose(row);
  rows.push(row);
  console.log(`${row.diagnosis === "ok" ? "✅" : "❌"} ${item.id.padEnd(22)} ${row.diagnosis}${grounded ? "" : "  ⚠️ not grounded"}`);
  if (!grounded) unsupportedClaims.forEach((claim) => console.log(`     unsupported: "${claim}"`));
}

// ---- The report ------------------------------------------------------------------
const answerable = rows.filter((r) => r.type === "answerable");
const unanswerable = rows.filter((r) => r.type === "unanswerable");
const pct = (n, d) => `${n}/${d} (${Math.round((n / d) * 100)}%)`;
const count = (list, test) => list.filter(test).length;
const mrr = answerable.reduce((s, r) => s + (r.rank ? 1 / r.rank : 0), 0) / answerable.length;

console.log("\n── Retrieval ─────────────────────────────");
console.log(`${`Right lesson in top ${K}:`.padEnd(31)}${pct(count(answerable, (r) => r.retrievalHit), answerable.length)}`);
console.log(`MRR:                           ${mrr.toFixed(2)}`);
console.log("── Generation ────────────────────────────");
console.log(`Correct answers:               ${pct(count(answerable, (r) => r.correct), answerable.length)}`);
console.log(`Correct when retrieval hit:    ${pct(count(answerable, (r) => r.retrievalHit && r.correct), count(answerable, (r) => r.retrievalHit))}`);
console.log(`Grounded in the documents:     ${pct(count(rows, (r) => r.grounded), rows.length)}`);
console.log(`Answers with citations:        ${pct(count(answerable, (r) => r.cited), answerable.length)}`);
console.log(`Said "I don't know" correctly: ${pct(count(unanswerable, (r) => r.correct), unanswerable.length)}`);
console.log("── What to fix ───────────────────────────");
const tally = {};
for (const r of rows) tally[r.diagnosis] = (tally[r.diagnosis] ?? 0) + 1;
for (const [diagnosis, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(3)}  ${diagnosis}`);
await mongo.close();
