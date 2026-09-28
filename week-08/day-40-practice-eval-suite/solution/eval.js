// Day 40 — 🛠️ Reference solution: one command that scores the whole pipeline
// Run: npm run eval                          (full suite: code checks + LLM judge + groundedness)
//      npm run eval -- --quick               (code checks only: free except for the answers)
//      npm run eval -- --retrieval vector    (score a different setup)
//      npm run eval -- --threshold 0.85      (fail if the score is below 85%)
// Needs the lessons ingested: npm run day27
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MODEL } from "../../../lib/claude.js";
import { answerQuestion } from "../../../lib/rag.js";
import { costOf } from "../../../lib/costs.js";
import { mongo } from "../../../lib/mongo.js";
import { evalSet } from "../../eval-set.js";
import { codeChecks } from "../../checks.js";
import { judge, checkGrounded } from "../../judge.js";

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const quick = args.includes("--quick");
const retrieval = option("--retrieval", "hybrid+rerank");
const threshold = Number(option("--threshold", "0.8"));
const REPORTS = fileURLToPath(new URL("../reports/", import.meta.url));

// ---- 1. Run every question and grade it -------------------------------------------------
async function evaluateItem(item) {
  const result = await answerQuestion(item.question, { retrieval });
  const failures = codeChecks(item, result);
  let verdict = null;
  let grounded = null;
  if (!quick) {
    const [judged, groundedness] = await Promise.all([judge(item, result.answer), checkGrounded(result.answer, result.chunks)]);
    verdict = judged.verdict;
    grounded = groundedness.grounded;
    if (verdict !== "correct") failures.push(`judge: ${verdict} (${judged.reasoning})`);
    if (!grounded) failures.push(`not grounded: ${groundedness.unsupportedClaims.join("; ")}`);
  }
  return { id: item.id, type: item.type, passed: failures.length === 0, failures, verdict, grounded, answer: result.answer, usage: result.usage };
}

console.log(`Eval: ${evalSet.length} questions · retrieval ${retrieval} · ${quick ? "code checks only" : "code + judge + groundedness"}\n`);
const started = Date.now();
const results = [];
for (let i = 0; i < evalSet.length; i += 4) {
  const batch = await Promise.all(
    evalSet.slice(i, i + 4).map((item) =>
      evaluateItem(item).catch((error) => ({ id: item.id, type: item.type, passed: false, failures: [`error: ${error.message}`] })),
    ),
  );
  for (const r of batch) console.log(`${r.passed ? "✅" : "❌"} ${r.id}`);
  results.push(...batch);
}

// ---- 2. Summarize --------------------------------------------------------------------
const passed = results.filter((r) => r.passed).length;
const score = passed / results.length;
const byType = Object.fromEntries(
  ["answerable", "unanswerable"].map((type) => {
    const subset = results.filter((r) => r.type === type);
    return [type, `${subset.filter((r) => r.passed).length}/${subset.length}`];
  }),
);
// What did the ANSWERS cost? (The judge's calls cost extra; keep an eye on both.)
const answerCost = results.reduce((sum, r) => sum + (r.usage ? costOf(r.usage, MODEL) ?? 0 : 0), 0);

// ---- 3. Compare with the previous report to find REGRESSIONS ----------------------------
// Only compare like with like: the latest earlier run with the SAME settings
mkdirSync(REPORTS, { recursive: true });
const sameSettings = (r) => r.settings.model === MODEL && r.settings.retrieval === retrieval && r.settings.quick === quick;
const previousFile = readdirSync(REPORTS)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .reverse()
  .find((f) => sameSettings(JSON.parse(readFileSync(path.join(REPORTS, f), "utf8"))));
const previous = previousFile ? JSON.parse(readFileSync(path.join(REPORTS, previousFile), "utf8")) : null;
const previouslyPassed = new Set(previous?.results.filter((r) => r.passed).map((r) => r.id) ?? []);
const regressions = results.filter((r) => !r.passed && previouslyPassed.has(r.id));
const fixed = results.filter((r) => r.passed && previous && !previouslyPassed.has(r.id));

// ---- 4. Save this report --------------------------------------------------------------
const report = {
  date: new Date().toISOString(),
  settings: { model: MODEL, retrieval, quick },
  score,
  byType,
  answerCostUsd: Number(answerCost.toFixed(4)),
  seconds: Math.round((Date.now() - started) / 1000),
  results,
};
const reportFile = path.join(REPORTS, `${report.date.replace(/[:.]/g, "-")}.json`);
writeFileSync(reportFile, JSON.stringify(report, null, 2));

// ---- 5. Print the result ---------------------------------------------------------------
console.log(`\nScore: ${passed}/${results.length} (${Math.round(score * 100)}%) · answerable ${byType.answerable} · unanswerable ${byType.unanswerable}`);
console.log(`Answers cost $${report.answerCostUsd} · took ${report.seconds}s`);
if (!previous) console.log("No earlier run with these settings to compare with.");
if (previous) {
  console.log(`Previous run with these settings: ${Math.round(previous.score * 100)}% (${previousFile})`);
  for (const r of regressions) console.log(`  🔻 REGRESSION ${r.id}: ${r.failures.join("; ")}`);
  for (const r of fixed) console.log(`  🔺 now passing: ${r.id}`);
}
for (const r of results.filter((r) => !r.passed && !regressions.includes(r))) console.log(`  ❌ ${r.id}: ${r.failures.join("; ")}`);
console.log(`Report saved: ${path.relative(process.cwd(), reportFile)}`);

// A non-zero exit code makes CI (e.g. GitHub Actions) mark the run as failed
const problems = [
  ...(score < threshold ? [`score below ${threshold * 100}%`] : []),
  ...(regressions.length ? [`${regressions.length} regression(s)`] : []),
];
if (problems.length) {
  console.log(`\n❌ FAILED: ${problems.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("\n✅ PASSED");
}
await mongo.close();
