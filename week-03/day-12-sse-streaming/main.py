"""Day 12 — Streaming to the browser with Server-Sent Events (SSE)

Run: python run.py day12, then open http://localhost:3000
"""

import json
import os
from pathlib import Path
from typing import Literal

import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from ailib.claude import MODEL, async_client

SYSTEM = "You are a friendly assistant for students. Keep answers clear. Use Markdown when it helps."

app = FastAPI(title="Day 12 Streaming Chat")


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=20)


@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, error: RequestValidationError):
    first = error.errors()[0]
    return JSONResponse({"error": f"{'.'.join(map(str, first['loc'][1:]))}: {first['msg']}"}, status_code=400)


def sse(data: dict) -> str:
    """One Server-Sent Event: "data: <json>" followed by a blank line."""
    return f"data: {json.dumps(data)}\n\n"


# POST /api/chat/stream  body: {"messages": [...]}  →  a stream of events:
#   {"type": "text", "text"}  many times, then  {"type": "done", "usage"}  or  {"type": "error", "message"}
@app.post("/api/chat/stream")
async def chat_stream(body: ChatRequest):
    async def events():
        try:
            async with async_client.messages.stream(
                model=MODEL,
                max_tokens=4096,
                system=SYSTEM,
                messages=[m.model_dump() for m in body.messages],
            ) as stream:
                async for text in stream.text_stream:
                    yield sse({"type": "text", "text": text})
                final = await stream.get_final_message()
            yield sse({"type": "done", "stopReason": final.stop_reason, "usage": final.usage.model_dump(exclude_none=True)})
        except Exception as error:  # noqa: BLE001 — anything that goes wrong must reach the browser as an event
            print("Stream failed:", error)
            # The 200 status was already sent, so errors must travel as an event too
            yield sse({"type": "error", "message": "The AI service had a problem. Please try again."})
        finally:
            # Runs even if the browser disconnects: FastAPI then stops this generator, and leaving the
            # `async with` block above closes the stream to Claude, so we stop paying for tokens nobody reads
            print("Stream closed")

    # text/event-stream tells the browser "keep the connection open, more is coming"
    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


# Serve index.html and anything else in public/ (declared last, so /api routes take priority)
app.mount("/", StaticFiles(directory=Path(__file__).parent / "public", html=True), name="public")

if __name__ == "__main__":
    uvicorn.run(app, port=int(os.getenv("PORT", "3000")))
