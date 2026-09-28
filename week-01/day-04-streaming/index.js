// Day 4 — Streaming responses
// Run: npm run day4 -- "Write a short story about a robot learning to cook momo"
import { client, MODEL } from "../../lib/claude.js";

const prompt = process.argv.slice(2).join(" ") || "Write a short story about a robot learning to cook momo.";

console.log(`Prompt: ${prompt}\n`);
const started = Date.now();
let firstTokenAt = null;

// .stream() sends the answer piece by piece instead of all at once at the end
const stream = client.messages.stream({
  model: MODEL,
  max_tokens: 4096,
  messages: [{ role: "user", content: prompt }],
});

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    firstTokenAt ??= Date.now();
    process.stdout.write(event.delta.text);
  }
}

// finalMessage() gives you the complete response once the stream has finished
const final = await stream.finalMessage();
const seconds = (ms) => (ms / 1000).toFixed(1) + "s";

console.log("\n\n--- Timing ---");
console.log("First text after:", seconds(firstTokenAt - started));
console.log("Finished after:  ", seconds(Date.now() - started));
console.log("Output tokens:   ", final.usage.output_tokens);
