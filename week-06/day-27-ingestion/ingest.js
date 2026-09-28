// Day 27 — The ingestion pipeline: files → text → chunks → embeddings → database
// Run: npm run day27                    (ingests this course's lessons: week-*/ folders)
//      npm run day27 -- ./my-documents  (ingests every .md, .txt and .pdf in a folder)
import { globSync } from "node:fs";
import path from "node:path";
import { loadFile, SUPPORTED_TYPES } from "../../lib/loaders.js";
import { ensureIndex, upsertDocument, removeDocument, listDocuments } from "../../lib/vector-store.js";
import { mongo } from "../../lib/mongo.js";

const folders = process.argv.slice(2);
const patterns = folders.length
  ? folders.map((folder) => `${folder.replace(/\/$/, "")}/**/*{${SUPPORTED_TYPES.join(",")}}`)
  : ["week-*/**/*.md"];

// 1. Find the files. The "source" name is the path relative to where you run the command.
const files = patterns
  .flatMap((pattern) => globSync(pattern, { exclude: (p) => p.includes("node_modules") }))
  .map((file) => path.normalize(file))
  .sort();
console.log(`Found ${files.length} files.\n`);

await ensureIndex();
const counts = { added: 0, updated: 0, unchanged: 0, failed: 0, removed: 0 };
const started = Date.now();

// 2. Load, clean, chunk, embed and save each file. Unchanged files are skipped (see lib/vector-store.js).
for (const file of files) {
  try {
    const pages = await loadFile(file);
    const result = await upsertDocument(file, pages);
    counts[result]++;
    if (result !== "unchanged") console.log(`  ${result === "added" ? "➕" : "🔄"} ${file}`);
  } catch (error) {
    // One bad file shouldn't stop the whole run
    counts.failed++;
    console.log(`  ❌ ${file}: ${error.message}`);
  }
}

// 3. Remove documents whose files were deleted, but only inside the folders we just scanned
const scanned = new Set(files);
const inScope = (source) =>
  folders.length ? folders.some((f) => source.startsWith(path.normalize(f) + path.sep)) : /^week-/.test(source);
for (const { source } of await listDocuments()) {
  if (inScope(source) && !scanned.has(source)) {
    await removeDocument(source);
    counts.removed++;
    console.log(`  🗑️  ${source}`);
  }
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(
  `\nDone in ${seconds}s: ${counts.added} added, ${counts.updated} updated, ` +
    `${counts.unchanged} unchanged, ${counts.removed} removed, ${counts.failed} failed.`,
);
await mongo.close();
