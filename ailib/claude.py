"""Shared setup used by every lesson: loads .env and creates one Claude client."""

import os
import sys

import anthropic

import ailib.env  # noqa: F401 — loads .env

MODEL = os.getenv("MODEL", "claude-opus-5")

if not (os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN")):
    print("⚠️  No ANTHROPIC_API_KEY found. Copy .env.example to .env and add your key.", file=sys.stderr)

# With no arguments the SDK reads ANTHROPIC_API_KEY from the environment
client = anthropic.Anthropic()
# The same, for `async` code: lets you send several requests at once (Day 6) and serve web requests (Week 3)
async_client = anthropic.AsyncAnthropic()


def text_of(response) -> str:
    """Collect all text blocks from a response into one string."""
    return "".join(block.text for block in response.content if block.type == "text")
