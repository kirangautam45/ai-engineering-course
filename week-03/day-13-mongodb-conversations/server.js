// Day 13 — Saving conversations in MongoDB
// Run: npm run day13  (needs MONGODB_URI in .env)
import express from "express";
import mongoose from "mongoose";
import { client, MODEL } from "../../lib/claude.js";
import Conversation from "./models/Conversation.js";

const SYSTEM = "You are a friendly assistant for students. Keep answers clear. Use Markdown when it helps.";
const MAX_CHARS = 4000;
// Only the most recent messages are sent to the model, so long chats don't get
// slower and more expensive forever. Older messages stay saved in the database.
const HISTORY_LIMIT = 20;

const app = express();
app.use(express.json({ limit: "20kb" }));

// Stop bad ids from reaching MongoDB, which would throw a CastError
app.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "Conversation not found" });
  next();
});

// List conversations, newest first (without the messages, to keep it small)
app.get("/api/conversations", async (req, res) => {
  const conversations = await Conversation.find({}, "title updatedAt").sort({ updatedAt: -1 }).limit(50);
  res.json(conversations);
});

// Start a new, empty conversation
app.post("/api/conversations", async (req, res) => {
  const conversation = await Conversation.create({});
  res.status(201).json(conversation);
});

// Get one conversation with all its messages
app.get("/api/conversations/:id", async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  res.json(conversation);
});

app.delete("/api/conversations/:id", async (req, res) => {
  await Conversation.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// Send a message and stream the reply (same SSE format as Day 12).
// The client sends ONLY the new message; the server owns the history.
app.post("/api/conversations/:id/messages", async (req, res) => {
  const content = req.body?.content?.trim();
  if (!content) return res.status(400).json({ error: "content is required" });
  if (content.length > MAX_CHARS) return res.status(400).json({ error: "message is too long" });

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  // 1. Save the user's message first, so it's never lost
  conversation.messages.push({ role: "user", content });
  if (conversation.messages.length === 1) conversation.title = content.slice(0, 50);
  await conversation.save();

  // 2. Build the history to send: the last HISTORY_LIMIT messages, starting with a user message
  let history = conversation.messages.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content }));
  while (history[0].role !== "user") history = history.slice(1);

  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const stream = client.messages.stream({ model: MODEL, max_tokens: 4096, system: SYSTEM, messages: history });
  res.on("close", () => {
    if (!res.writableEnded) stream.abort();
  });

  let answer = "";
  let outputTokens;
  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        answer += event.delta.text;
        send({ type: "text", text: event.delta.text });
      }
    }
    const final = await stream.finalMessage();
    outputTokens = final.usage.output_tokens;
    send({ type: "done", stopReason: final.stop_reason, usage: final.usage });
  } catch (error) {
    if (!stream.aborted) {
      console.error("Stream failed:", error.message);
      send({ type: "error", message: "The AI service had a problem. Please try again." });
    }
  }

  // 3. Save the reply — even a partial one if the user pressed Stop, so the history makes sense
  if (answer) {
    conversation.messages.push({ role: "assistant", content: answer, outputTokens });
    await conversation.save();
  }
  res.end();
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return res.end();
  res.status(500).json({ error: "Something went wrong on the server." });
});

if (!process.env.MONGODB_URI) {
  console.error("Add MONGODB_URI to your .env file first (see .env.example).");
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI);
console.log("Connected to MongoDB");

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Chat API with history running on http://localhost:${PORT}`));
