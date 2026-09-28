// Day 11 — An Express chat API
// Run: npm run day11, then POST to http://localhost:3000/api/chat
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { client, MODEL, textOf } from "../../lib/claude.js";
import { validateMessages } from "./validate.js";

const app = express();
// Limit the request body size so nobody can send us a giant (expensive) prompt
app.use(express.json({ limit: "20kb" }));

const SYSTEM = "You are a friendly assistant for students. Keep answers short and clear.";

app.get("/api/health", (req, res) => {
  res.json({ ok: true, model: MODEL });
});

// POST /api/chat  body: { messages: [{ role: "user", content: "Hi!" }] }
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body ?? {};
  const problem = validateMessages(messages);
  if (problem) return res.status(400).json({ error: problem });

  // Only pass on the fields we expect — never forward the raw body to the API
  const clean = messages.map(({ role, content }) => ({ role, content }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    messages: clean,
  });

  res.json({
    reply: textOf(response),
    stopReason: response.stop_reason,
    usage: response.usage,
  });
});

// Express 5 sends errors thrown in async routes here automatically
app.use((err, req, res, next) => {
  if (err instanceof Anthropic.RateLimitError) {
    return res.status(429).json({ error: "The AI is busy. Please try again in a minute." });
  }
  if (err instanceof Anthropic.APIError) {
    console.error("Claude API error:", err.status ?? "no connection", err.message);
    return res.status(502).json({ error: "The AI service had a problem. Please try again." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Chat API running on http://localhost:${PORT}`));
