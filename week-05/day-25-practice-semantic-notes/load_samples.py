"""Adds the sample notes to a running Notes API.

Run (with the server running): python run.py day25:samples
"""

import json
import os
from pathlib import Path

import httpx

BASE_URL = os.getenv("NOTES_URL", "http://localhost:3000")
samples = json.loads((Path(__file__).parent / "sample-notes.json").read_text(encoding="utf-8"))

for note in samples:
    response = httpx.post(f"{BASE_URL}/api/notes", json=note, timeout=30)
    print(f"✅ {note['title']}" if response.is_success else f"❌ {note['title']}: {response.json().get('error')}")
