// Day 2 — Tokens and cost
// Run: npm run day2 -- "Namaste! How many tokens is this sentence?"
import { client, MODEL, textOf } from "../../lib/claude.js";

// Price per 1 million tokens in US dollars. Check the latest prices at
// https://www.anthropic.com/pricing and update these if they change.
const PRICE_PER_MILLION = { input: 5, output: 25 }; // claude-opus-5

const text = process.argv.slice(2).join(" ") || "Namaste! How many tokens is this sentence?";
const messages = [{ role: "user", content: text }];

// 1. Count tokens BEFORE sending — this call is free and doesn't generate anything
const count = await client.messages.countTokens({ model: MODEL, messages });
console.log(`Your prompt is ${count.input_tokens} tokens (${text.length} characters).`);

// 2. Send the real request
const response = await client.messages.create({ model: MODEL, max_tokens: 1024, messages });
console.log("\nAnswer:\n" + textOf(response));

// 3. Work out what it cost
const { input_tokens, output_tokens } = response.usage;
const cost =
  (input_tokens / 1_000_000) * PRICE_PER_MILLION.input +
  (output_tokens / 1_000_000) * PRICE_PER_MILLION.output;

console.log("\n--- Bill ---");
console.log(`Input:  ${input_tokens} tokens`);
console.log(`Output: ${output_tokens} tokens`);
console.log(`Cost:   $${cost.toFixed(6)}  (about ${Math.round(1 / cost)} of these per dollar)`);
