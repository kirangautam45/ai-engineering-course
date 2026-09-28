// Shared setup used by every lesson: loads .env and creates one Claude client.
import Anthropic from "@anthropic-ai/sdk";
import { existsSync } from "node:fs";

// Node 20.12+ can read a .env file without any extra package
if (existsSync(".env")) process.loadEnvFile(".env");

export const MODEL = process.env.MODEL ?? "claude-opus-5";

// With no arguments the SDK reads ANTHROPIC_API_KEY from the environment
export const client = new Anthropic();

// Collect all text blocks from a response into one string
export function textOf(response) {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
