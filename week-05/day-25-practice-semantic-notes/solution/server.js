// Day 25 — 🛠️ Reference solution: a Notes API with semantic search
// Run: npm run day25   (needs MONGODB_URI pointing to Atlas or atlas-local)
import express from "express";
import { ObjectId } from "mongodb";
import { embed, DIMENSIONS } from "../../../lib/embeddings.js";
import { mongo, db, waitForSearchIndex } from "../../day-24-vector-database/db.js";

const notes = db.collection("notes");
const INDEX_NAME = "notes_vector_index";

// What gets embedded: the title and the content together, so both are searchable
const textToEmbed = (note) => `${note.title}\n${note.content}`;

// Never send the 384 numbers back to the client: they're big and useless to a person
const withoutEmbedding = { projection: { embedding: 0 } };

const app = express();
app.use(express.json({ limit: "20kb" }));

function validate(body) {
  const title = body?.title?.trim();
  const content = body?.content?.trim();
  if (!title || !content) return { error: "title and content are required" };
  if (title.length > 200 || content.length > 5000) return { error: "title or content is too long" };
  return { title, content };
}

app.param("id", (req, res, next, id) => {
  if (!ObjectId.isValid(id)) return res.status(404).json({ error: "Note not found" });
  req.noteId = new ObjectId(id);
  next();
});

// Semantic search. Declared before "/:id" routes so "search" isn't treated as an id.
// GET /api/notes/search?q=exam dates&limit=5
app.get("/api/notes/search", async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: "q is required" });
  const limit = Math.min(Number(req.query.limit) || 5, 20);

  const [queryVector] = await embed(q);
  const results = await notes
    .aggregate([
      { $vectorSearch: { index: INDEX_NAME, path: "embedding", queryVector, numCandidates: limit * 20, limit } },
      { $project: { embedding: 0, score: { $meta: "vectorSearchScore" } } },
    ])
    .toArray();
  res.json(results);
});

app.get("/api/notes", async (req, res) => {
  res.json(await notes.find({}, withoutEmbedding).sort({ createdAt: -1 }).toArray());
});

app.get("/api/notes/:id", async (req, res) => {
  const note = await notes.findOne({ _id: req.noteId }, withoutEmbedding);
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json(note);
});

// Embed when a note is saved, so searching later is instant
app.post("/api/notes", async (req, res) => {
  const { error, title, content } = validate(req.body);
  if (error) return res.status(400).json({ error });

  const [embedding] = await embed(textToEmbed({ title, content }));
  const note = { title, content, embedding, createdAt: new Date(), updatedAt: new Date() };
  const { insertedId } = await notes.insertOne(note);
  res.status(201).json({ _id: insertedId, title, content, createdAt: note.createdAt });
});

// The text changed, so the embedding must change too — otherwise search finds the OLD meaning
app.put("/api/notes/:id", async (req, res) => {
  const { error, title, content } = validate(req.body);
  if (error) return res.status(400).json({ error });

  const [embedding] = await embed(textToEmbed({ title, content }));
  const note = await notes.findOneAndUpdate(
    { _id: req.noteId },
    { $set: { title, content, embedding, updatedAt: new Date() } },
    { returnDocument: "after", ...withoutEmbedding },
  );
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json(note);
});

app.delete("/api/notes/:id", async (req, res) => {
  const { deletedCount } = await notes.deleteOne({ _id: req.noteId });
  if (!deletedCount) return res.status(404).json({ error: "Note not found" });
  res.status(204).end();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

// Create the vector index on first start
await mongo.connect();
if ((await notes.listSearchIndexes(INDEX_NAME).toArray()).length === 0) {
  // A search index can only be created on a collection that exists
  await db.createCollection("notes").catch(() => {});
  await notes.createSearchIndex({
    name: INDEX_NAME,
    type: "vectorSearch",
    definition: { fields: [{ type: "vector", path: "embedding", numDimensions: DIMENSIONS, similarity: "cosine" }] },
  });
}
await waitForSearchIndex(notes, INDEX_NAME);
await embed("warm up"); // load the model now, so the first request isn't slow

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Notes API with semantic search on http://localhost:${PORT}`));
