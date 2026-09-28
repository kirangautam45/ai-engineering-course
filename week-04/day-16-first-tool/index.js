// Day 16 — Your first tool: a calculator
// Run: npm run day16 -- "What is 18% VAT on NPR 45,999, and what's the total?"
import { client, MODEL, textOf } from "../../lib/claude.js";

// 1. DESCRIBE the tool. The model only sees this description, never your code.
const tools = [
  {
    name: "calculate",
    description:
      "Do one arithmetic operation on two numbers. Use this for any maths instead of calculating in your head, " +
      "because exact answers matter. For multi-step problems, call it once per step.",
    input_schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "The first number" },
        b: { type: "number", description: "The second number" },
        operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
      },
      required: ["a", "b", "operation"],
    },
  },
];

// 2. IMPLEMENT the tool. This is normal JavaScript that runs on YOUR computer.
function calculate({ a, b, operation }) {
  if (operation === "add") return a + b;
  if (operation === "subtract") return a - b;
  if (operation === "multiply") return a * b;
  if (operation === "divide") {
    if (b === 0) throw new Error("Cannot divide by zero");
    return a / b;
  }
  throw new Error(`Unknown operation: ${operation}`);
}

const question = process.argv.slice(2).join(" ") || "What is 18% VAT on NPR 45,999, and what's the total?";
const messages = [{ role: "user", content: question }];
console.log(`🙋 ${question}\n`);

// 3. THE LOOP: ask → if the model wants a tool, run it and send back the result → ask again
for (let turn = 1; turn <= 10; turn++) {
  const response = await client.messages.create({ model: MODEL, max_tokens: 4096, tools, messages });

  // The model's reply (including any tool requests) becomes part of the history
  messages.push({ role: "assistant", content: response.content });

  if (response.stop_reason !== "tool_use") {
    console.log(`\n🤖 ${textOf(response)}`);
    break;
  }

  // Run every tool the model asked for and collect the results
  const results = [];
  for (const block of response.content) {
    if (block.type !== "tool_use") continue;
    try {
      const answer = calculate(block.input);
      console.log(`🔧 calculate(${JSON.stringify(block.input)}) = ${answer}`);
      results.push({ type: "tool_result", tool_use_id: block.id, content: String(answer) });
    } catch (error) {
      console.log(`⚠️  calculate(${JSON.stringify(block.input)}) failed: ${error.message}`);
      results.push({ type: "tool_result", tool_use_id: block.id, content: error.message, is_error: true });
    }
  }

  // Tool results go back as a USER message — they're information for the model to read
  messages.push({ role: "user", content: results });
}
