// Day 22 — Generating and storing embeddings
// Run: npm run day22 -- build                       (embed every lesson README, save to index.json)
//      npm run day22 -- search "how do I stop a stream?"
import { readFileSync, writeFileSync, existsSync, globSync } from "node:fs";
import { embed, cosineSimilarity, EMBEDDING_MODEL } from "../../lib/embeddings.js";

const INDEX_FILE = new URL("./index.json", import.meta.url);
const BATCH_SIZE = 8; // embed several texts per call: much faster than one at a time

const [command, ...rest] = process.argv.slice(2);

if (command === "build") {
  // Every lesson README in the repo, e.g. week-01/day-01-first-call/README.md
  const files = globSync("week-*/day-*/README.md").sort();
  const docs = files.map((file) => {
    const text = readFileSync(file, "utf8");
    return { file, title: text.match(/^# (.+)/m)?.[1] ?? file, text };
  });

  console.log(`Embedding ${docs.length} READMEs with ${EMBEDDING_MODEL}...`);
  const started = Date.now();
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const vectors = await embed(batch.map((d) => d.text));
    batch.forEach((doc, j) => (doc.embedding = vectors[j]));
    console.log(`  ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length}`);
  }

  // Save the vectors with their source, so we never embed the same text twice.
  // We store the model name too: vectors from different models can't be compared.
  const index = { model: EMBEDDING_MODEL, createdAt: new Date().toISOString(), docs };
  writeFileSync(INDEX_FILE, JSON.stringify(index));
  const kb = Math.round(readFileSync(INDEX_FILE).length / 1024);
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s. Saved index.json (${kb} KB).`);
} else if (command === "search") {
  const query = rest.join(" ");
  if (!query) throw new Error('Usage: npm run day22 -- search "your question"');
  if (!existsSync(INDEX_FILE)) throw new Error("Run `npm run day22 -- build` first.");

  const index = JSON.parse(readFileSync(INDEX_FILE, "utf8"));
  if (index.model !== EMBEDDING_MODEL) throw new Error("The index was built with another model. Rebuild it.");

  // Embed the question with the SAME model, then compare it with every document
  const [queryVector] = await embed(query);
  const results = index.docs
    .map((doc) => ({ ...doc, score: cosineSimilarity(queryVector, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  console.log(`🔎 "${query}"\n`);
  for (const r of results) console.log(`  ${r.score.toFixed(3)}  ${r.title}\n         ${r.file}`);
} else {
  console.log('Usage:\n  npm run day22 -- build\n  npm run day22 -- search "your question"');
}
