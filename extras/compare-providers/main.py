"""Ask every provider you have a key for the same question, side by side.

Run: python run.py providers "Explain recursion to a 10-year-old in 3 sentences"
"""

import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

from ailib.llm import PROVIDERS, available_providers, chat

question = " ".join(sys.argv[1:]) or "Explain recursion to a 10-year-old in 3 sentences."
# Ollama is always "available" (no key), but only works if it's installed and running
providers = [p for p in available_providers() if p != "ollama" or os.getenv("OLLAMA_MODEL")]

if not providers:
    sys.exit("No providers configured. Add at least one API key to .env (see .env.example).")


def ask(provider: str) -> dict:
    started = time.perf_counter()
    try:
        result = chat(provider=provider, messages=[{"role": "user", "content": question}], max_tokens=1024)
        return {**result, "seconds": time.perf_counter() - started}
    except Exception as error:  # noqa: BLE001 — one broken provider shouldn't hide the others
        return {"provider": provider, "error": str(error)}


print(f"🙋 {question}\n")
# Ask them all at the same time
with ThreadPoolExecutor() as pool:
    results = list(pool.map(ask, providers))

for r in results:
    model = f" · {r['model']}" if r.get("model") else ""
    print(f"==================== {PROVIDERS[r['provider']]['label']}{model} ====================")
    if "error" in r:
        print(f"❌ {r['error']}\n")
        continue
    print(r["text"].strip())
    usage = r["usage"]
    print(f"\n⏱️  {r['seconds']:.1f}s · {usage['input_tokens'] or '?'} in / {usage['output_tokens'] or '?'} out tokens\n")
