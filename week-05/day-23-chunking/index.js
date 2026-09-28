// Day 23 — Chunking: which way of splitting documents finds answers best?
// Run: npm run day23
import { readFileSync, globSync } from "node:fs";
import { embed, cosineSimilarity } from "../../lib/embeddings.js";
import { chunkBySize, chunkByHeadings } from "../../lib/chunking.js";
import { testQueries } from "./test-queries.js";

const TOP_K = 3;

const docs = globSync("week-0[1-4]/day-*/README.md")
  .sort()
  .map((file) => ({ file, text: readFileSync(file, "utf8") }));

// Three ways to turn documents into searchable pieces
const strategies = {
  "Whole document (Day 22)": (doc) => [{ text: doc.text }],
  "Fixed size, 80 words": (doc) => chunkBySize(doc.text, { size: 80, overlap: 20 }),
  "By heading, then size": (doc) => chunkByHeadings(doc.text, { size: 80, overlap: 20 }),
};

const queryVectors = await embed(testQueries.map((q) => q.query));

for (const [name, split] of Object.entries(strategies)) {
  // 1. Chunk every document and remember which file each chunk came from (metadata!)
  const chunks = docs.flatMap((doc) => split(doc).map((chunk) => ({ ...chunk, file: doc.file })));
  const vectors = await embed(chunks.map((c) => c.text));

  // 2. For each test question, find the best chunks and check whether the right file is in the top K
  let hits = 0;
  const misses = [];
  testQueries.forEach(({ query, expect }, i) => {
    const ranked = chunks
      .map((chunk, j) => ({ file: chunk.file, score: cosineSimilarity(queryVectors[i], vectors[j]) }))
      .sort((a, b) => b.score - a.score);

    // Several chunks can come from the same file; count each file once
    const topFiles = [...new Set(ranked.map((r) => r.file))].slice(0, TOP_K);
    if (topFiles.some((file) => file.includes(expect))) hits++;
    else misses.push(query);
  });

  const avgWords = Math.round(chunks.reduce((n, c) => n + c.text.split(/\s+/).length, 0) / chunks.length);
  console.log(`\n${name}`);
  console.log(`  ${chunks.length} chunks, ~${avgWords} words each`);
  console.log(`  Found the right lesson in the top ${TOP_K} for ${hits}/${testQueries.length} questions`);
  for (const query of misses) console.log(`    ✗ "${query}"`);
}

// Show what a heading-based chunk looks like
const sample = chunkByHeadings(docs[11].text)[3];
console.log(`\nExample chunk from ${docs[11].file}:\n  "${sample.text.slice(0, 200)}..."`);
