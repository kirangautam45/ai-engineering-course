// Day 12 — Streaming to the browser with Server-Sent Events (SSE)
// Run: npm run day12, then open http://localhost:3000
import express from "express";
import { client, MODEL } from "../../lib/claude.js";
import { validateMessages } from "../day-11-express-chat-api/validate.js";

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(express.static(new URL("./public", import.meta.url).pathname)); // serves index.html

const SYSTEM = "You are a friendly assistant for students. Keep answers clear. Use Markdown when it helps.";

// Send one SSE event. Each event is "data: <json>" followed by a blank line.
function sendEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// POST /api/chat/stream  body: { messages: [...] }  →  a stream of events:
//   { type: "text", text }  many times, then  { type: "done", usage }  or  { type: "error", message }
app.post("/api/chat/stream", async (req, res) => {
  const { messages } = req.body ?? {};
  const problem = validateMessages(messages);
  if (problem) return res.status(400).json({ error: problem });

  // These headers tell the browser "keep the connection open, more is coming"
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    messages: messages.map(({ role, content }) => ({ role, content })),
  });

  // If the user closes the tab or presses Stop, stop generating: we pay for every token
  res.on("close", () => {
    if (!res.writableEnded) {
      console.log("Client disconnected, aborting the stream");
      stream.abort();
    }
  });

  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        sendEvent(res, { type: "text", text: event.delta.text });
      }
    }
    const final = await stream.finalMessage();
    sendEvent(res, { type: "done", stopReason: final.stop_reason, usage: final.usage });
  } catch (error) {
    if (stream.aborted) return; // the client left; nobody to tell
    console.error("Stream failed:", error.message);
    // The 200 status was already sent, so errors must travel as an event too
    sendEvent(res, { type: "error", message: "The AI service had a problem. Please try again." });
  }
  res.end();
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Open http://localhost:${PORT}`));
