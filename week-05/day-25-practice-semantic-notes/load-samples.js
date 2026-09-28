// Adds the sample notes to a running Notes API.
// Run (with the server running): npm run day25:samples
import { readFileSync } from "node:fs";

const BASE_URL = process.env.NOTES_URL ?? "http://localhost:3000";
const samples = JSON.parse(readFileSync(new URL("./sample-notes.json", import.meta.url), "utf8"));

for (const note of samples) {
  const res = await fetch(`${BASE_URL}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  console.log(res.ok ? `✅ ${note.title}` : `❌ ${note.title}: ${(await res.json()).error}`);
}
