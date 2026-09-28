// Guardrails for AI features in production: rate limiting, secret redaction and request logging.
import { appendFileSync, mkdirSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

// ---- Rate limiting -----------------------------------------------------------------
// Each user may make `max` requests per `windowMs`. Kept in memory: fine for one server.
// (With several servers, store the counts in Redis or MongoDB instead.)
export function rateLimit({ max = 5, windowMs = 60_000, keyOf = (req) => req.ip } = {}) {
  const hits = new Map(); // key → timestamps of recent requests
  return (req, res, next) => {
    const key = keyOf(req);
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ error: `Too many questions. Try again in ${retryAfter} seconds.` });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

// ---- Redaction ---------------------------------------------------------------------
// Remove secrets and personal data before text is sent to a model or written to a log.
// Patterns catch the common cases, not every case: they're a safety net, not a guarantee.
const PATTERNS = [
  { name: "API_KEY", regex: /\b(sk-[A-Za-z0-9._-]{15,}[A-Za-z0-9_-]|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,})/g }, // sk-… covers OpenAI, Anthropic, DeepSeek, Qwen
  { name: "PASSWORD", regex: /\b(password|passwd|pwd)\s*[:=]\s*\S+/gi },
  { name: "EMAIL", regex: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { name: "PHONE", regex: /(?<!\d)(\+?977[-\s]?)?9[678]\d{8}(?!\d)/g }, // Nepali mobile numbers
  { name: "CARD", regex: /\b(?:\d[ -]?){13,16}\b/g },
];

// Returns the cleaned text and which kinds of data were found
export function redact(text) {
  const found = new Set();
  let clean = text;
  for (const { name, regex } of PATTERNS) {
    clean = clean.replace(regex, () => {
      found.add(name);
      return `[${name} REMOVED]`;
    });
  }
  return { text: clean, found: [...found] };
}

// ---- Logging -----------------------------------------------------------------------
// One JSON object per line ("JSON Lines"): easy to append, grep, and load into a dashboard.
export function createLogger(file = "logs/requests.jsonl") {
  mkdirSync(path.dirname(file), { recursive: true });
  return {
    file,
    log(entry) {
      appendFileSync(file, JSON.stringify({ time: new Date().toISOString(), ...entry }) + "\n");
    },
  };
}

export const newRequestId = () => randomUUID();

// Log WHO made a request without storing who they are: a short one-way hash
export const anonymize = (value) => createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
