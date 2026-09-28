// Day 34 — Prompt caching: pay full price for a big prompt once, then ~10% on repeats
// Run: npm run day34
// Puts EVERY lesson README in the prompt ("long context", no retrieval) and asks 3 questions.
import { readFileSync, globSync } from "node:fs";
import { client, MODEL, textOf } from "../../lib/claude.js";
import { costOf, costWithoutCache } from "../../lib/costs.js";

// About 20,000 tokens of course material. It's identical for every question, so it's worth caching.
const course = globSync("week-*/day-*/README.md")
  .sort()
  .map((file) => `<lesson source="${file}">\n${readFileSync(file, "utf8")}\n</lesson>`)
  .join("\n");

const questions = [
  "Which free APIs does the course use for weather and exchange rates?",
  "What's the difference between hit@3 and MRR?",
  "Which lesson explains prompt injection, and what are its two defences?",
];

// The stable part goes FIRST and gets the cache marker. Anything that changes per request
// (the question) comes AFTER it. Change one byte before the marker and the cache misses.
const system = [
  { type: "text", text: "You answer questions about the AI engineering course below. Be brief and name the lesson." },
  { type: "text", text: `<course>\n${course}\n</course>`, cache_control: { type: "ephemeral" } }, // cached for 5 minutes
];

let totalCost = 0;
let totalWithoutCache = 0;
console.log(`Model: ${MODEL}\n`);

for (const [i, question] of questions.entries()) {
  const started = Date.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: question }],
  });
  const u = response.usage;
  const cost = costOf(u, MODEL);
  const uncached = costWithoutCache(u, MODEL);
  totalCost += cost ?? 0;
  totalWithoutCache += uncached ?? 0;

  console.log(`Q${i + 1}: ${question}`);
  console.log(`   ${textOf(response).replace(/\s+/g, " ").slice(0, 160)}`);
  console.log(
    `   written to cache: ${u.cache_creation_input_tokens ?? 0} · read from cache: ${u.cache_read_input_tokens ?? 0} · ` +
      `uncached input: ${u.input_tokens} · output: ${u.output_tokens} · ${Date.now() - started} ms`,
  );
  if (cost != null) console.log(`   cost $${cost.toFixed(4)} (would be $${uncached.toFixed(4)} without caching)\n`);
}

if (totalWithoutCache) {
  const saved = 100 - (totalCost / totalWithoutCache) * 100;
  console.log(`Total: $${totalCost.toFixed(4)} instead of $${totalWithoutCache.toFixed(4)}, ${saved.toFixed(0)}% saved.`);
} else {
  console.log(`(Add ${MODEL} to the PRICES table in lib/costs.js to see costs.)`);
}

// The standing check: if the 2nd and 3rd questions didn't read from the cache, something
// before the cache marker is changing between requests (a date, a random id, reordered text).
