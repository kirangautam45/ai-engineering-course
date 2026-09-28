// Day 26 — How RAG works: the same question with and without retrieved context
// Run: npm run day26 -- "Which free weather and exchange rate APIs are used, and do they need a key?"
import { readFileSync, globSync } from "node:fs";
import { client, MODEL, textOf } from "../../lib/claude.js";
import { embed, cosineSimilarity } from "../../lib/embeddings.js";
import { chunkBySize } from "../../lib/chunking.js";

const question =
  process.argv.slice(2).join(" ") || "Which free weather and exchange rate APIs are used, and do they need a key?";
const TOP_K = 4;

// ---- R: RETRIEVE ------------------------------------------------------------
// Our "knowledge base" is this course's own lesson READMEs. The model has never seen them.
const chunks = globSync("week-*/day-*/README.md")
  .sort()
  .flatMap((file) => chunkBySize(readFileSync(file, "utf8")).map((c) => ({ file, text: c.text })));

const [questionVector, ...chunkVectors] = await embed([question, ...chunks.map((c) => c.text)]);
const retrieved = chunks
  .map((chunk, i) => ({ ...chunk, score: cosineSimilarity(questionVector, chunkVectors[i]) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, TOP_K);

console.log(`🙋 ${question}\n\n📚 Retrieved ${TOP_K} of ${chunks.length} chunks:`);
for (const r of retrieved) console.log(`  ${r.score.toFixed(3)}  ${r.file}`);

// ---- A: AUGMENT -------------------------------------------------------------
// Put the retrieved text into the prompt, clearly separated from the question
const context = retrieved
  .map((r, i) => `<document index="${i + 1}" source="${r.file}">\n${r.text}\n</document>`)
  .join("\n");

const augmentedPrompt = `<documents>
${context}
</documents>

Answer the question using only the documents above. If they don't contain the answer, say you don't know.

Question: ${question}`;

// ---- G: GENERATE ------------------------------------------------------------
async function ask(prompt) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return { answer: textOf(response), inputTokens: response.usage.input_tokens };
}

const [withoutRag, withRag] = await Promise.all([ask(question), ask(augmentedPrompt)]);

console.log(`\n==================== Without RAG (${withoutRag.inputTokens} input tokens) ====================`);
console.log(withoutRag.answer);
console.log(`\n==================== With RAG (${withRag.inputTokens} input tokens) ====================`);
console.log(withRag.answer);
