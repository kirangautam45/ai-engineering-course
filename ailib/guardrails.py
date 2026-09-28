"""Guardrails for AI features in production: rate limiting, secret redaction and request logging."""

import hashlib
import json
import math
import re
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

# ---- Rate limiting -----------------------------------------------------------------


class RateLimiter:
    """Each user may make `max_requests` requests per `window_seconds`. Kept in memory: fine for one server.
    (With several servers, store the counts in Redis or MongoDB instead.)
    """

    def __init__(self, max_requests: int = 5, window_seconds: float = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.hits: dict[str, list[float]] = {}  # key → times of recent requests
        self.lock = threading.Lock()  # plain `def` endpoints run in several threads at once

    def check(self, key: str) -> int | None:
        """Records a request. Returns None if it's allowed, or the seconds to wait if it isn't."""
        now = time.monotonic()
        with self.lock:
            recent = [t for t in self.hits.get(key, []) if now - t < self.window]
            if len(recent) >= self.max_requests:
                self.hits[key] = recent
                return math.ceil(recent[0] + self.window - now)
            recent.append(now)
            self.hits[key] = recent
            return None


# ---- Redaction ---------------------------------------------------------------------
# Remove secrets and personal data before text is sent to a model or written to a log.
# Patterns catch the common cases, not every case: they're a safety net, not a guarantee.
PATTERNS = [
    ("API_KEY", re.compile(r"\b(sk-[A-Za-z0-9._-]{15,}[A-Za-z0-9_-]|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,})")),  # sk-… covers OpenAI, Anthropic, DeepSeek, Qwen
    ("PASSWORD", re.compile(r"\b(password|passwd|pwd)\s*[:=]\s*\S+", re.IGNORECASE)),
    ("EMAIL", re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")),
    ("PHONE", re.compile(r"(?<!\d)(\+?977[-\s]?)?9[678]\d{8}(?!\d)")),  # Nepali mobile numbers
    ("CARD", re.compile(r"\b(?:\d[ -]?){13,16}\b")),
]


def redact(text: str) -> tuple[str, list[str]]:
    """Returns the cleaned text and which kinds of data were found."""
    found = []
    for name, pattern in PATTERNS:
        text, count = pattern.subn(f"[{name} REMOVED]", text)
        if count and name not in found:
            found.append(name)
    return text, found


# ---- Logging -----------------------------------------------------------------------


class Logger:
    """One JSON object per line ("JSON Lines"): easy to append, grep, and load into a dashboard."""

    def __init__(self, file: str | Path = "logs/requests.jsonl"):
        self.file = Path(file)
        self.file.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()

    def log(self, entry: dict) -> None:
        line = json.dumps({"time": datetime.now(timezone.utc).isoformat(), **entry}, ensure_ascii=False)
        with self.lock, self.file.open("a", encoding="utf-8") as f:
            f.write(line + "\n")


def new_request_id() -> str:
    return str(uuid.uuid4())


def anonymize(value: str) -> str:
    """Log WHO made a request without storing who they are: a short one-way hash."""
    return hashlib.sha256(str(value).encode()).hexdigest()[:12]
