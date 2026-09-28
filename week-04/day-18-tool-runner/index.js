// Day 18 — The tool runner: let the SDK run the loop
// Run: npm run day18 -- "Compare the weather in Kathmandu, Pokhara and Lukla, and convert 500 USD to NPR"
import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { client, MODEL, textOf } from "../../lib/claude.js";
import { getWeather, convertCurrency } from "../day-17-multiple-tools/services.js";

// A tool is now ONE object: name + description + Zod schema + the function to run.
// The SDK turns the Zod schema into JSON schema and checks the model's input against it.
const weatherTool = betaZodTool({
  name: "get_weather",
  description:
    "Get the current weather for one city. For several cities, call it several times in the same turn.",
  inputSchema: z.object({
    city: z.string().describe('City name only, e.g. "Pokhara"'),
  }),
  run: getWeather, // if this throws, the runner sends the error back with is_error: true
});

const currencyTool = betaZodTool({
  name: "convert_currency",
  description: "Convert an amount of money between currencies using today's exchange rate.",
  inputSchema: z.object({
    amount: z.number().positive(),
    from: z.string().length(3).describe("3-letter currency code, e.g. USD"),
    to: z.string().length(3).describe("3-letter currency code, e.g. NPR"),
  }),
  run: convertCurrency,
});

const question =
  process.argv.slice(2).join(" ") ||
  "Compare the weather in Kathmandu, Pokhara and Lukla right now, and convert 500 USD to NPR.";
console.log(`🙋 ${question}\n`);

const runner = client.beta.messages.toolRunner({
  model: MODEL,
  max_tokens: 4096,
  system: "You are a helpful travel assistant for Nepal. Use the tools for live data; never guess numbers.",
  tools: [weatherTool, currencyTool],
  messages: [{ role: "user", content: question }],
  max_iterations: 10, // safety limit: stop after 10 model calls even if it keeps asking for tools
});

// You can simply `await runner` to get the final message.
// Looping over it instead lets us watch each step as it happens.
for await (const message of runner) {
  for (const block of message.content) {
    if (block.type === "tool_use") console.log(`🔧 ${block.name}(${JSON.stringify(block.input)})`);
  }
}

const final = await runner.done();
console.log(`\n🤖 ${textOf(final)}`);
console.log(`\n(stop_reason: ${final.stop_reason})`);
