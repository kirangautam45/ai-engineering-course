// Day 17 — Multiple tools, parallel calls and errors
// Run: npm run day17 -- "What's the weather in Kathmandu and Pokhara, and how much is 250 USD in NPR?"
import { client, MODEL, textOf } from "../../lib/claude.js";
import { getWeather, convertCurrency } from "./services.js";

const tools = [
  {
    name: "get_weather",
    description:
      "Get the current weather for one city: temperature, humidity, rain and wind. " +
      "Call it once per city. For several cities, call it several times in the same turn.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: 'City name only, e.g. "Pokhara" or "Delhi"' },
      },
      required: ["city"],
    },
  },
  {
    name: "convert_currency",
    description: "Convert an amount of money between currencies using today's exchange rate.",
    input_schema: {
      type: "object",
      properties: {
        amount: { type: "number" },
        from: { type: "string", description: "3-letter currency code, e.g. USD" },
        to: { type: "string", description: "3-letter currency code, e.g. NPR" },
      },
      required: ["amount", "from", "to"],
    },
  },
];

// Map each tool name to the function that runs it
const handlers = {
  get_weather: getWeather,
  convert_currency: convertCurrency,
};

async function runTool(block) {
  const handler = handlers[block.name];
  try {
    if (!handler) throw new Error(`Unknown tool: ${block.name}`);
    const content = await handler(block.input);
    console.log(`  ✅ ${block.name}(${JSON.stringify(block.input)})`);
    return { type: "tool_result", tool_use_id: block.id, content };
  } catch (error) {
    // Tell the model what went wrong, so it can fix its input or explain it to the user
    console.log(`  ❌ ${block.name}(${JSON.stringify(block.input)}): ${error.message}`);
    return { type: "tool_result", tool_use_id: block.id, content: error.message, is_error: true };
  }
}

const question =
  process.argv.slice(2).join(" ") ||
  "What's the weather in Kathmandu and Pokhara right now, and how much is 250 USD in NPR?";
const messages = [{ role: "user", content: question }];
console.log(`🙋 ${question}\n`);

for (let turn = 1; turn <= 10; turn++) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: "You are a helpful travel assistant for Nepal. Use the tools for live data; never guess numbers.",
    tools,
    messages,
  });
  messages.push({ role: "assistant", content: response.content });

  if (response.stop_reason !== "tool_use") {
    console.log(`\n🤖 ${textOf(response)}`);
    break;
  }

  const calls = response.content.filter((block) => block.type === "tool_use");
  console.log(`Turn ${turn}: the model asked for ${calls.length} tool call(s)`);

  // Run them all at the same time, then send ALL results back in ONE message
  const results = await Promise.all(calls.map(runTool));
  messages.push({ role: "user", content: results });
}
