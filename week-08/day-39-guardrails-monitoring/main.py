"""Day 39 — Guardrails and monitoring: make an AI endpoint safe to put in front of the public

Run: python run.py day39   (needs the lessons ingested: python run.py day27)
"""

import json
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

import anthropic
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ailib.claude import MODEL
from ailib.costs import cost_of
from ailib.guardrails import Logger, RateLimiter, anonymize, new_request_id, redact
from ailib.mongo import mongo
from ailib.rag import answer_question

MAX_BODY_BYTES = 5_000
MAX_QUESTION_CHARS = 500
logger = Logger(Path(__file__).parent / "logs" / "requests.jsonl")
limiter = RateLimiter(max_requests=5, window_seconds=60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    mongo.close()


app = FastAPI(title="Guarded API", lifespan=lifespan)


# Guardrail 1: small bodies only
@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    if int(request.headers.get("content-length") or 0) > MAX_BODY_BYTES:
        return JSONResponse({"error": "Request body is too large."}, status_code=413)
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, error: RequestValidationError):
    first = error.errors()[0]
    return JSONResponse({"error": f"{'.'.join(map(str, first['loc'][1:]))}: {first['msg']}"}, status_code=400)


@app.exception_handler(HTTPException)
async def http_error(request: Request, error: HTTPException):
    return JSONResponse({"error": error.detail}, status_code=error.status_code, headers=error.headers)


def user_of(request: Request) -> str:
    """A real app would use the logged-in user's id. Here, an optional header or the IP address."""
    return request.headers.get("x-user-id") or request.client.host


def rate_limited(request: Request) -> str:
    """Guardrail 2: 5 questions per minute per user. A dependency runs before the endpoint does."""
    user = user_of(request)
    retry_after = limiter.check(user)
    if retry_after is not None:
        raise HTTPException(429, f"Too many questions. Try again in {retry_after} seconds.",
                            headers={"Retry-After": str(retry_after)})
    return user


class Question(BaseModel):
    question: str


# POST /api/ask  {"question"}  →  {"answer", "citations", "requestId"}
@app.post("/api/ask")
def ask(body: Question, user: str = Depends(rate_limited)):
    request_id = new_request_id()
    started = time.perf_counter()
    entry = {"requestId": request_id, "route": "/api/ask", "user": anonymize(user), "model": MODEL}

    # Guardrail 3: validate input before spending anything on it
    raw = body.question.strip()
    if not raw:
        raise HTTPException(400, "question is required")
    if len(raw) > MAX_QUESTION_CHARS:
        raise HTTPException(400, f"Keep questions under {MAX_QUESTION_CHARS} characters.")

    # Guardrail 4: remove secrets and personal data BEFORE they reach the model or the logs
    question, redacted_in = redact(raw)

    try:
        # Guardrail 5: never wait forever. 30 s per attempt, 2 retries for temporary errors.
        result = answer_question(question, request_options={"timeout": 30, "max_retries": 2})
    except Exception as error:  # noqa: BLE001
        # Guardrail 7: fail politely, and log enough to debug it later
        status = 503 if isinstance(error, anthropic.RateLimitError) else 502
        latency_ms = round((time.perf_counter() - started) * 1000)
        logger.log({**entry, "status": status, "latencyMs": latency_ms, "question": question,
                    "error": type(error).__name__, "message": str(error)})
        print(f"[{request_id}] {type(error).__name__}: {error}")
        return JSONResponse({"error": "The assistant is having trouble right now. Please try again shortly.",
                             "requestId": request_id}, status_code=status)

    # Guardrail 6: check the output too. The model can repeat secrets that were in a document.
    answer, redacted_out = redact(
        "Sorry, I can't help with that request." if result["stop_reason"] == "refusal" else result["answer"]
    )
    usage = result["usage"]
    logger.log({
        **entry,
        "status": 200,
        "latencyMs": round((time.perf_counter() - started) * 1000),
        "question": question,  # already redacted
        "answer": answer[:500],
        "stopReason": result["stop_reason"],
        "sources": sorted({c["source"] for c in result["chunks"]}),
        "inputTokens": usage and usage.input_tokens,
        "outputTokens": usage and usage.output_tokens,
        "costUsd": (cost_of(usage, MODEL) or 0) if usage else 0,
        "redacted": redacted_in + redacted_out,
    })
    response = {"answer": answer, "citations": result["citations"], "requestId": request_id}
    if redacted_in:
        response["warning"] = "We removed private data from your question."
    return response


# GET /api/stats — a tiny monitoring dashboard built from the log file
@app.get("/api/stats")
def stats():
    lines = logger.file.read_text(encoding="utf-8").splitlines() if logger.file.exists() else []
    entries = [json.loads(line) for line in lines if line.strip()]
    ok = [e for e in entries if e["status"] == 200]
    latencies = sorted(e["latencyMs"] for e in ok)
    return {
        "requests": len(entries),
        "errors": len(entries) - len(ok),
        "users": len({e["user"] for e in entries}),
        "medianLatencyMs": latencies[len(latencies) // 2] if latencies else None,
        "p95LatencyMs": latencies[int(len(latencies) * 0.95)] if latencies else None,
        "totalTokens": sum((e.get("inputTokens") or 0) + (e.get("outputTokens") or 0) for e in ok),
        "totalCostUsd": round(sum(e.get("costUsd") or 0 for e in ok), 4),
        "refusals": sum(e.get("stopReason") == "refusal" for e in ok),
        "requestsWithPrivateData": sum(bool(e.get("redacted")) for e in entries),
    }


if __name__ == "__main__":
    print(f"Guarded API · logs in {logger.file}")
    uvicorn.run(app, port=int(os.getenv("PORT", "3000")))
