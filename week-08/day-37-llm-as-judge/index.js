// Day 37 — LLM-as-judge: grade open-ended answers automatically, but check the judge first
// Run: npm run day37                 (check the judge against human grades)
//      npm run day37 -- --last-run   (judge the answers saved by Day 36, compare with the code checks)
import { readFileSync, existsSync } from "node:fs";
import { judge } from "../judge.js";
import { evalSet } from "../eval-set.js";
import { humanLabels } from "./human-labels.js";

const byId = Object.fromEntries(evalSet.map((item) => [item.id, item]));
const icon = { correct: "✅", partially_correct: "🟡", incorrect: "❌" };

if (process.argv.includes("--last-run")) {
  // ---- Judge real answers from Day 36 ----------------------------------------------
  const file = new URL("../day-36-why-evals/last-run.json", import.meta.url);
  if (!existsSync(file)) throw new Error("Run `npm run day36` first.");
  const { results } = JSON.parse(readFileSync(file, "utf8"));
  let disagreements = 0;
  for (const r of results.filter((r) => r.answer)) {
    const { verdict, reasoning } = await judge(byId[r.id], r.answer);
    const codePassed = r.failures.length === 0;
    const judgePassed = verdict === "correct";
    const flag = codePassed === judgePassed ? "" : "  ⚠️ judge and code checks disagree";
    if (flag) disagreements++;
    console.log(`${icon[verdict]} ${r.id.padEnd(22)} code: ${codePassed ? "pass" : "fail"}${flag}`);
    if (flag) console.log(`     ${reasoning}\n     Answer: ${r.answer.replace(/\s+/g, " ").slice(0, 200)}`);
  }
  console.log(`\n${disagreements} disagreement(s). Read each one: which grader was right?`);
} else {
  // ---- Calibrate: does the judge agree with a human? ----------------------------------
  let agree = 0;
  for (const label of humanLabels) {
    const { verdict, reasoning } = await judge(byId[label.item], label.answer);
    const same = verdict === label.human;
    if (same) agree++;
    console.log(`${same ? "✅" : "❌"} ${label.item.padEnd(20)} human: ${label.human.padEnd(17)} judge: ${verdict}`);
    if (!same) console.log(`     "${label.answer}"\n     Judge said: ${reasoning}`);
  }
  const percent = Math.round((agree / humanLabels.length) * 100);
  console.log(`\nThe judge agreed with the human on ${agree}/${humanLabels.length} answers (${percent}%).`);
  console.log(percent >= 85 ? "Good enough to use, but keep spot-checking." : "Too low to trust: improve the rubric, then run this again.");
}
