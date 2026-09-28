// Ask every provider you have a key for the same question, side by side.
// Run: npm run providers -- "Explain recursion to a 10-year-old in 3 sentences"
import { chat, availableProviders, PROVIDERS } from "../../lib/llm.js";

const question = process.argv.slice(2).join(" ") || "Explain recursion to a 10-year-old in 3 sentences.";
// Ollama is always "available" (no key), but only works if it's installed and running
const providers = availableProviders().filter((p) => p !== "ollama" || process.env.OLLAMA_MODEL);

if (providers.length === 0) {
  console.log("No providers configured. Add at least one API key to .env (see .env.example).");
  process.exit(1);
}

console.log(`🙋 ${question}\n`);
const results = await Promise.all(
  providers.map(async (provider) => {
    const started = Date.now();
    try {
      const r = await chat({ provider, messages: [{ role: "user", content: question }], maxTokens: 1024 });
      return { ...r, seconds: (Date.now() - started) / 1000 };
    } catch (error) {
      return { provider, error: error.message };
    }
  }),
);

for (const r of results) {
  console.log(`==================== ${PROVIDERS[r.provider].label}${r.model ? ` · ${r.model}` : ""} ====================`);
  if (r.error) {
    console.log(`❌ ${r.error}\n`);
    continue;
  }
  console.log(r.text.trim());
  console.log(`\n⏱️  ${r.seconds.toFixed(1)}s · ${r.usage.inputTokens ?? "?"} in / ${r.usage.outputTokens ?? "?"} out tokens\n`);
}
