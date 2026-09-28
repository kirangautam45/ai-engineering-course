// Day 36 — Why evals matter: run the pipeline on a fixed test set and grade it with code
// Run: npm run day36                              (all 30 questions)
//      npm run day36 -- --only weather-api        (one question)
//      npm run day36 -- --retrieval vector        (compare with Day 28-style retrieval)
// Needs the lessons ingested: npm run day27
import { writeFileSync } from "node:fs";
import { answerQuestion } from "../../lib/rag.js";
import { mongo } from "../../lib/mongo.js";
import { evalSet } from "../eval-set.js";
import { codeChecks } from "../checks.js";

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const retrieval = option("--retrieval") ?? "hybrid+rerank";
const items = option("--only") ? evalSet.filter((i) => i.id === option("--only")) : evalSet;

console.log(`Running ${items.length} questions (retrieval: ${retrieval})...\n`);
const results = [];

// A few at a time: fast, without hitting rate limits
for (let i = 0; i < items.length; i += 4) {
  const batch = items.slice(i, i + 4);
  const answered = await Promise.all(
    batch.map(async (item) => {
      try {
        const result = await answerQuestion(item.question, { retrieval });
        return { item, result, failures: codeChecks(item, result) };
      } catch (error) {
        return { item, result: null, failures: [`error: ${error.message}`] };
      }
    }),
  );
  for (const { item, result, failures } of answered) {
    console.log(`${failures.length ? "❌" : "✅"} ${item.id.padEnd(22)} ${failures.join("; ")}`);
    results.push({ id: item.id, type: item.type, question: item.question, answer: result?.answer, citations: result?.citations, failures });
  }
}

// Summary per type: you want to see WHERE it fails, not only how often
for (const type of ["answerable", "unanswerable"]) {
  const subset = results.filter((r) => r.type === type);
  if (subset.length) console.log(`\n${type.padEnd(13)} ${subset.filter((r) => !r.failures.length).length}/${subset.length} passed`);
}
const passed = results.filter((r) => !r.failures.length).length;
console.log(`${"total".padEnd(13)} ${passed}/${results.length} passed`);

// Save every answer: the failures only make sense when you read what was actually said
writeFileSync(new URL("./last-run.json", import.meta.url), JSON.stringify({ retrieval, date: new Date(), results }, null, 2));
console.log("\nAll answers saved to week-08/day-36-why-evals/last-run.json. Read the failures!");
await mongo.close();
