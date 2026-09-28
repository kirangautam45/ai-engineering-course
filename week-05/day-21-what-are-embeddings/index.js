// Day 21 — What are embeddings?
// Run: npm run day21
import { embed, cosineSimilarity } from "../../lib/embeddings.js";

// ---- Part 1: similarity with tiny hand-made vectors -------------------------
// Imagine each word described by 3 scores: [is it an animal?, is it food?, is it a vehicle?]
const toy = {
  dog: [0.9, 0.1, 0.0],
  cat: [0.95, 0.05, 0.0],
  momo: [0.0, 0.95, 0.0],
  bus: [0.0, 0.0, 0.9],
};
console.log("Part 1: hand-made vectors");
console.log(`  dog vs cat:  ${cosineSimilarity(toy.dog, toy.cat).toFixed(2)}`);
console.log(`  dog vs momo: ${cosineSimilarity(toy.dog, toy.momo).toFixed(2)}`);
console.log(`  dog vs bus:  ${cosineSimilarity(toy.dog, toy.bus).toFixed(2)}`);

// ---- Part 2: real embeddings from a model ------------------------------------
const sentences = [
  "How do I reset my password?",
  "I forgot my login details",
  "पासवर्ड बिर्सिएँ, के गर्ने?", // "I forgot my password, what do I do?" in Nepali
  "The canteen serves momo on Fridays",
  "What's for lunch today?",
  "The bus to Pokhara leaves at 7 AM",
  "When does the next vehicle to Pokhara depart?",
];

console.log("\nPart 2: loading the embedding model (the first run downloads it)...");
const vectors = await embed(sentences);
console.log(`Each sentence became ${vectors[0].length} numbers. The first five of sentence 1:`);
console.log(" ", vectors[0].slice(0, 5).map((n) => n.toFixed(3)).join(", "), "...");

// Compare every pair and show the most and least similar
const pairs = [];
for (let i = 0; i < sentences.length; i++) {
  for (let j = i + 1; j < sentences.length; j++) {
    pairs.push({ a: sentences[i], b: sentences[j], score: cosineSimilarity(vectors[i], vectors[j]) });
  }
}
pairs.sort((x, y) => y.score - x.score);

const show = ({ a, b, score }) => console.log(`  ${score.toFixed(3)}  "${a}"  ↔  "${b}"`);
console.log("\nMost similar pairs:");
pairs.slice(0, 4).forEach(show);
console.log("\nLeast similar pairs:");
pairs.slice(-3).forEach(show);

// ---- Part 3: keyword search vs semantic search -----------------------------
const question = "vehicle to Pokhara";
console.log(`\nPart 3: searching for "${question}"`);

const keywordHits = sentences.filter((s) => s.toLowerCase().includes("vehicle"));
console.log(`  Keyword search for "vehicle" finds: ${keywordHits.map((s) => `"${s}"`).join(", ")}`);

const [queryVector] = await embed(question);
const ranked = sentences
  .map((s, i) => ({ s, score: cosineSimilarity(queryVector, vectors[i]) }))
  .sort((x, y) => y.score - x.score);
console.log("  Semantic search ranks:");
ranked.slice(0, 3).forEach(({ s, score }) => console.log(`    ${score.toFixed(3)}  "${s}"`));
