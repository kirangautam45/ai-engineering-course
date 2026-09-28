"""Day 11 — A FastAPI chat API

Run: python run.py day11, then POST to http://localhost:3000/api/chat
Interactive docs (try requests in the browser): http://localhost:3000/docs
"""

import os
from typing import Literal

import anthropic
import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from ailib.claude import MODEL, async_client, text_of

SYSTEM = "You are a friendly assistant for students. Keep answers short and clear."
MAX_BODY_BYTES = 20_000

app = FastAPI(title="Day 11 Chat API")


# ---- 1. Describe what a valid request looks like. FastAPI checks it for us. --------
class Message(BaseModel):
    # Only "user" and "assistant": who should control the system prompt? (the server!)
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=20)

    @field_validator("messages")
    @classmethod
    def starts_and_ends_with_user(cls, messages: list[Message]) -> list[Message]:
        if messages[0].role != "user":
            raise ValueError("the first message must be from the user")
        if messages[-1].role != "user":
            raise ValueError("the last message must be from the user")
        return messages


# ---- 2. Reject huge bodies before reading them, so nobody sends a giant (expensive) prompt ----
@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    if int(request.headers.get("content-length") or 0) > MAX_BODY_BYTES:
        return JSONResponse({"error": "Request body is too large."}, status_code=413)
    return await call_next(request)


@app.get("/api/health")
async def health():
    return {"ok": True, "model": MODEL}


# POST /api/chat  body: {"messages": [{"role": "user", "content": "Hi!"}]}
@app.post("/api/chat")
async def chat(body: ChatRequest):
    response = await async_client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM,
        # model_dump() gives plain dicts with only the fields we defined: extra fields never reach the API
        messages=[m.model_dump() for m in body.messages],
    )
    return {
        "reply": text_of(response),
        "stopReason": response.stop_reason,
        "usage": response.usage.model_dump(exclude_none=True),
    }


# ---- 3. Turn errors into friendly responses, without leaking internal details -----
# FastAPI's default for invalid input is 422 with a detailed list. Our front ends expect
# {"error": "..."}, so we send the first problem as a plain sentence instead.
@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, error: RequestValidationError):
    first = error.errors()[0]
    where = ".".join(str(part) for part in first["loc"][1:])  # e.g. "messages.0.role"
    return JSONResponse({"error": f"{where}: {first['msg']}"}, status_code=400)


@app.exception_handler(anthropic.RateLimitError)
async def rate_limited(request: Request, error: anthropic.RateLimitError):
    return JSONResponse({"error": "The AI is busy. Please try again in a minute."}, status_code=429)


@app.exception_handler(anthropic.APIError)
async def api_error(request: Request, error: anthropic.APIError):
    print("Claude API error:", getattr(error, "status_code", "no connection"), error.message)
    return JSONResponse({"error": "The AI service had a problem. Please try again."}, status_code=502)


if __name__ == "__main__":
    uvicorn.run(app, port=int(os.getenv("PORT", "3000")))
