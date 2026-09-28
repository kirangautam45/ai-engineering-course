// Day 3 — System prompts and multi-turn chat
// Run: npm run day3   (type "exit" to quit)
import readline from "node:readline/promises";
import { client, MODEL, textOf } from "../../lib/claude.js";

// The system prompt sets the assistant's role and rules for the whole conversation
const SYSTEM = `You are a friendly JavaScript tutor for beginner students.
Keep answers short: at most 5 sentences, plus a code example when it helps.
If a question is not about programming, politely steer back to JavaScript.`;

// The API has no memory. WE keep the history and send all of it every time.
const history = [];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log('JS Tutor ready! Type "exit" to quit.\n');

while (true) {
  const question = (await rl.question("You: ")).trim();
  if (!question) continue;
  if (question.toLowerCase() === "exit") break;

  history.push({ role: "user", content: question });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    messages: history,
  });

  const answer = textOf(response);
  history.push({ role: "assistant", content: answer });

  console.log(`\nTutor: ${answer}\n`);
  console.log(`(history: ${history.length} messages, ${response.usage.input_tokens} input tokens)\n`);
}

rl.close();
