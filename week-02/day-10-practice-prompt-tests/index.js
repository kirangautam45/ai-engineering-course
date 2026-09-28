// Day 10 — 🛠️ Practice: a prompt library with automated tests
// Run: npm run day10                (all prompts)
//      npm run day10 -- classifier  (one prompt)
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { client, MODEL, textOf } from "../../lib/claude.js";
import classifier from "./prompts/classifier.js";
import summarizer from "./prompts/summarizer.js";
import extractor from "./prompts/extractor.js";

const allPrompts = [classifier, summarizer, extractor];
const only = process.argv[2];
const prompts = only ? allPrompts.filter((p) => p.name === only) : allPrompts;

// Run one test case: send the input, get the output (text or parsed JSON)
async function run(prompt, test) {
  const request = {
    model: MODEL,
    max_tokens: 1024,
    system: prompt.system,
    output_config: { effort: prompt.effort },
    messages: [{ role: "user", content: prompt.build(test.input) }],
  };

  if (prompt.schema) {
    request.output_config.format = zodOutputFormat(prompt.schema);
    const response = await client.messages.parse(request);
    return response.parsed_output;
  }
  return textOf(await client.messages.create(request));
}

let passed = 0;
let total = 0;

for (const prompt of prompts) {
  console.log(`\n📝 ${prompt.name} (v${prompt.version})`);

  // Run every test case for this prompt at the same time
  const results = await Promise.all(
    prompt.tests.map(async (test) => {
      try {
        const output = await run(prompt, test);
        return { test, output, verdict: output == null ? "no output" : prompt.check(output, test) };
      } catch (error) {
        return { test, output: null, verdict: `error: ${error.message}` };
      }
    }),
  );

  for (const { test, output, verdict } of results) {
    total++;
    const ok = verdict === true;
    if (ok) passed++;
    const input = test.input.replace(/\s+/g, " ").slice(0, 50);
    console.log(`  ${ok ? "✅" : "❌"} ${input.padEnd(50)} → ${JSON.stringify(output)}`);
    if (!ok) console.log(`     ${verdict === false ? `expected ${JSON.stringify(test.expect)}` : verdict}`);
  }
}

console.log(`\nScore: ${passed}/${total} passed`);
process.exitCode = passed === total ? 0 : 1; // non-zero exit fails a CI build
