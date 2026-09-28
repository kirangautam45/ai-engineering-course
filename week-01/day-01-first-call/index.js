// Day 1 — Your first LLM API call
// Run: npm run day1 -- "Explain what an API is in one sentence"
import { client, MODEL, textOf } from "../../lib/claude.js";

// Everything after `npm run day1 --` becomes the question
const question = process.argv.slice(2).join(" ") || "Say hello to a new AI engineering student!";

const response = await client.messages.create({
  model: MODEL,
  max_tokens: 1024,
  messages: [{ role: "user", content: question }],
});

console.log("Question:", question);
console.log("\nAnswer:\n" + textOf(response));

// Peek at the rest of the response object — this is what the API really sends back
console.log("\n--- Behind the scenes ---");
console.log("Model:", response.model);
console.log("Stop reason:", response.stop_reason);
console.log("Tokens in / out:", response.usage.input_tokens, "/", response.usage.output_tokens);
