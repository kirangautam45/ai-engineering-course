// Day 8 — Thinking and effort
// Run: npm run day8
// Asks the same puzzle at "low" and "high" effort and compares answer, thinking, tokens and time.
import { client, MODEL, textOf } from "../../lib/claude.js";

const puzzle = `Four friends — Aarav, Bina, Chirag and Diya — sit in a row of 4 seats (numbered 1 to 4, left to right).
- Bina is not at either end.
- Aarav sits somewhere to the right of Diya.
- Chirag sits directly next to Diya.
- Aarav is not in seat 3.
- Chirag is not in seat 1.
Who sits in each seat? Give the final answer as: 1=?, 2=?, 3=?, 4=?`;

async function solve(effort) {
  const started = Date.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Adaptive thinking: the model decides when and how much to think.
    // display: "summarized" returns a readable summary of that thinking.
    thinking: { type: "adaptive", display: "summarized" },
    // effort controls how hard it tries: low | medium | high | xhigh | max
    output_config: { effort },
    messages: [{ role: "user", content: puzzle }],
  });

  const thinking = response.content
    .filter((block) => block.type === "thinking")
    .map((block) => block.thinking)
    .join("\n");

  return {
    effort,
    seconds: ((Date.now() - started) / 1000).toFixed(1),
    outputTokens: response.usage.output_tokens,
    thinking,
    answer: textOf(response),
  };
}

for (const effort of ["low", "high"]) {
  const result = await solve(effort);
  console.log(`\n==================== effort: ${effort} ====================`);
  console.log(`💭 Thinking summary:\n${result.thinking || "(no thinking needed)"}`);
  console.log(`\n✅ Answer:\n${result.answer}`);
  console.log(`\n⏱️  ${result.seconds}s · ${result.outputTokens} output tokens (thinking counts as output)`);
}
