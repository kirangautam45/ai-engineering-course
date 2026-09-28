// ask() — send one question and get back text you can trust.
// Built on Day 5; later lessons reuse it.
import { client, MODEL, textOf } from "./claude.js";

export async function ask(prompt, { system, maxTokens = 2048 } = {}) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
    // If the model declines a request for safety reasons, the API retries it on a
    // recommended fallback model automatically instead of just refusing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  // Always check WHY the model stopped before trusting the answer
  switch (response.stop_reason) {
    case "end_turn":
      return textOf(response);
    case "max_tokens":
      return textOf(response) + "\n\n[⚠️ Answer was cut off — increase maxTokens]";
    case "refusal":
      return "[The model declined to answer this request.]";
    default:
      return `[Stopped early: ${response.stop_reason}]`;
  }
}
