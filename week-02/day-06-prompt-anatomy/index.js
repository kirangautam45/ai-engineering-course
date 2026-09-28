// Day 6 — Anatomy of a good prompt
// Run: npm run day6
// Sends the SAME customer review with three prompts, from vague to clear, and prints the answers side by side.
import { client, MODEL, textOf } from "../../lib/claude.js";

const review = `Ordered the chicken momo set on Friday night. Food took 55 minutes, arrived cold,
and the achar was missing. The rider was polite though. The momos themselves tasted great once
I reheated them. Called support twice, nobody picked up. Probably won't order again unless this is fixed.`;

const prompts = {
  "1. Vague": `Summarize this: ${review}`,

  "2. Specific": `Summarize this customer review in 2 bullet points: what went wrong, and what went well.

${review}`,

  // Role + task + context + constraints + output format, with the REASON for each rule
  "3. Full anatomy": `You are helping the operations team of a food delivery app in Kathmandu.
They read hundreds of reviews a day, so they need summaries they can act on in seconds.

<review>
${review}
</review>

Write a summary with exactly these three lines:
Problems: the specific failures, so the team knows what to fix
Positives: anything the customer liked, so the team knows what to keep
Risk: "high", "medium" or "low" chance we lose this customer, with a 5-word reason

Keep each line under 20 words. Don't add anything else, because this goes straight into a dashboard.`,
};

// Run all three in parallel — they don't depend on each other
const results = await Promise.all(
  Object.entries(prompts).map(async ([name, prompt]) => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    return { name, answer: textOf(response), tokens: response.usage.output_tokens };
  }),
);

for (const { name, answer, tokens } of results) {
  console.log(`\n==================== ${name} (${tokens} output tokens) ====================`);
  console.log(answer);
}
