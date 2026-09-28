"""Day 34 — Prompt caching: pay full price for a big prompt once, then ~10% on repeats

Run: python run.py day34
Puts EVERY lesson README in the prompt ("long context", no retrieval) and asks 3 questions.
"""

import time
from pathlib import Path

from ailib.claude import MODEL, client, text_of
from ailib.costs import cost_of, cost_without_cache

# About 20,000 tokens of course material. It's identical for every question, so it's worth caching.
course = "\n".join(
    f'<lesson source="{path.as_posix()}">\n{path.read_text(encoding="utf-8")}\n</lesson>'
    for path in sorted(Path().glob("week-*/day-*/README.md"))
)

questions = [
    "Which free APIs does the course use for weather and exchange rates?",
    "What's the difference between hit@3 and MRR?",
    "Which lesson explains prompt injection, and what are its two defences?",
]

# The stable part goes FIRST and gets the cache marker. Anything that changes per request
# (the question) comes AFTER it. Change one byte before the marker and the cache misses.
system = [
    {"type": "text", "text": "You answer questions about the AI engineering course below. Be brief and name the lesson."},
    {"type": "text", "text": f"<course>\n{course}\n</course>", "cache_control": {"type": "ephemeral"}},  # cached for 5 minutes
]

total_cost = 0.0
total_without_cache = 0.0
print(f"Model: {MODEL}\n")

for i, question in enumerate(questions, start=1):
    started = time.perf_counter()
    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        output_config={"effort": "low"},
        system=system,
        messages=[{"role": "user", "content": question}],
    )
    u = response.usage
    cost = cost_of(u, MODEL)
    uncached = cost_without_cache(u, MODEL)
    total_cost += cost or 0
    total_without_cache += uncached or 0

    print(f"Q{i}: {question}")
    print(f"   {' '.join(text_of(response).split())[:160]}")
    print(
        f"   written to cache: {u.cache_creation_input_tokens or 0} · read from cache: {u.cache_read_input_tokens or 0} · "
        f"uncached input: {u.input_tokens} · output: {u.output_tokens} · {(time.perf_counter() - started) * 1000:.0f} ms"
    )
    if cost is not None:
        print(f"   cost ${cost:.4f} (would be ${uncached:.4f} without caching)\n")

if total_without_cache:
    saved = 100 - total_cost / total_without_cache * 100
    print(f"Total: ${total_cost:.4f} instead of ${total_without_cache:.4f}, {saved:.0f}% saved.")
else:
    print(f"(Add {MODEL} to the PRICES table in ailib/costs.py to see costs.)")

# The standing check: if the 2nd and 3rd questions didn't read from the cache, something
# before the cache marker is changing between requests (a date, a random id, reordered text).
