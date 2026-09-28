// Day 5 — 🛠️ Practice day: a reliable "ask" command-line tool
// Run: npm run day5 -- --role "a travel guide for Nepal" "Plan one day in Pokhara"
import Anthropic from "@anthropic-ai/sdk";
import { ask } from "../../lib/ask.js";

// ---- 1. Read options from the command line ---------------------------------
const args = process.argv.slice(2);
let role = "a helpful assistant";
const roleIndex = args.indexOf("--role");
if (roleIndex !== -1) {
  role = args[roleIndex + 1];
  args.splice(roleIndex, 2);
}
const question = args.join(" ");

if (!question) {
  console.log('Usage: npm run day5 -- [--role "who the assistant is"] "your question"');
  process.exit(1);
}

// ---- 2. Call ask() (see lib/ask.js), and handle every kind of failure --------
try {
  const answer = await ask(question, { system: `You are ${role}. Be concise and practical.` });
  console.log(answer);
} catch (error) {
  // Check the most specific error types first
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("❌ Your API key is missing or wrong. Check the .env file.");
  } else if (error instanceof Anthropic.RateLimitError) {
    console.error("⏳ Too many requests. Wait a minute and try again.");
  } else if (error instanceof Anthropic.BadRequestError) {
    console.error("❌ The request was invalid:", error.message);
  } else if (error instanceof Anthropic.APIError) {
    console.error(`❌ API error ${error.status}:`, error.message);
  } else {
    console.error("❌ Could not reach the API. Are you online?", error.message);
  }
  process.exit(1);
}
