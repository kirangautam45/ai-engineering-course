// Day 39 — Guardrails and monitoring: make an AI endpoint safe to put in front of the public
// Run: npm run day39   (needs the lessons ingested: npm run day27)
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "../../lib/claude.js";
import { answerQuestion } from "../../lib/rag.js";
import { costOf } from "../../lib/costs.js";
import { rateLimit, redact, createLogger, newRequestId, anonymize } from "../../lib/guardrails.js";
import { mongo } from "../../lib/mongo.js";

const MAX_QUESTION_CHARS = 500;
const logger = createLogger(fileURLToPath(new URL("./logs/requests.jsonl", import.meta.url)));

const app = express();
app.use(express.json({ limit: "5kb" })); // guardrail 1: small bodies only

// A real app would use the logged-in user's id. Here, an optional header or the IP address.
const userOf = (req) => req.get("x-user-id") ?? req.ip;

// POST /api/ask  { question }  →  { answer, citations, requestId }
app.post(
  "/api/ask",
  rateLimit({ max: 5, windowMs: 60_000, keyOf: userOf }), // guardrail 2: 5 questions per minute per user
  async (req, res) => {
    const requestId = newRequestId();
    const started = Date.now();
    const entry = { requestId, route: "/api/ask", user: anonymize(userOf(req)), model: MODEL };

    // Guardrail 3: validate input before spending anything on it
    const raw = req.body?.question;
    if (typeof raw !== "string" || !raw.trim()) return res.status(400).json({ error: "question is required" });
    if (raw.length > MAX_QUESTION_CHARS) {
      return res.status(400).json({ error: `Keep questions under ${MAX_QUESTION_CHARS} characters.` });
    }

    // Guardrail 4: remove secrets and personal data BEFORE they reach the model or the logs
    const { text: question, found: redactedIn } = redact(raw.trim());

    try {
      // Guardrail 5: never wait forever. 30 s per attempt, 2 retries for temporary errors.
      const result = await answerQuestion(question, { requestOptions: { timeout: 30_000, maxRetries: 2 } });

      // Guardrail 6: check the output too. The model can repeat secrets that were in a document.
      const { text: answer, found: redactedOut } = redact(
        result.stopReason === "refusal" ? "Sorry, I can't help with that request." : result.answer,
      );

      logger.log({
        ...entry,
        status: 200,
        latencyMs: Date.now() - started,
        question, // already redacted
        answer: answer.slice(0, 500),
        stopReason: result.stopReason,
        sources: [...new Set(result.chunks.map((c) => c.source))],
        inputTokens: result.usage?.input_tokens,
        outputTokens: result.usage?.output_tokens,
        costUsd: result.usage ? costOf(result.usage, MODEL) : 0,
        redacted: [...redactedIn, ...redactedOut],
      });
      res.json({ answer, citations: result.citations, requestId, ...(redactedIn.length && { warning: "We removed private data from your question." }) });
    } catch (error) {
      // Guardrail 7: fail politely, and log enough to debug it later
      const status = error instanceof Anthropic.RateLimitError ? 503 : 502;
      logger.log({ ...entry, status, latencyMs: Date.now() - started, question, error: error.constructor.name, message: error.message });
      console.error(`[${requestId}] ${error.constructor.name}: ${error.message}`);
      res.status(status).json({ error: "The assistant is having trouble right now. Please try again shortly.", requestId });
    }
  },
);

// GET /api/stats — a tiny monitoring dashboard built from the log file
app.get("/api/stats", (req, res) => {
  const lines = existsSync(logger.file) ? readFileSync(logger.file, "utf8").trim().split("\n").filter(Boolean) : [];
  const entries = lines.map((line) => JSON.parse(line));
  const ok = entries.filter((e) => e.status === 200);
  const latencies = ok.map((e) => e.latencyMs).sort((a, b) => a - b);
  res.json({
    requests: entries.length,
    errors: entries.length - ok.length,
    users: new Set(entries.map((e) => e.user)).size,
    medianLatencyMs: latencies[Math.floor(latencies.length / 2)] ?? null,
    p95LatencyMs: latencies[Math.floor(latencies.length * 0.95)] ?? null,
    totalTokens: ok.reduce((n, e) => n + (e.inputTokens ?? 0) + (e.outputTokens ?? 0), 0),
    totalCostUsd: Number(ok.reduce((n, e) => n + (e.costUsd ?? 0), 0).toFixed(4)),
    refusals: ok.filter((e) => e.stopReason === "refusal").length,
    requestsWithPrivateData: entries.filter((e) => e.redacted?.length).length,
  });
});

const PORT = process.env.PORT ?? 3000;
await mongo.connect();
app.listen(PORT, () => console.log(`Guarded API on http://localhost:${PORT} · logs in ${logger.file}`));
