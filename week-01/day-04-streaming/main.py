"""Day 4 — Streaming responses

Run: python run.py day4 "Write a short story about a robot learning to cook momo"
"""

import sys
import time

from ailib.claude import MODEL, client

prompt = " ".join(sys.argv[1:]) or "Write a short story about a robot learning to cook momo."

print(f"Prompt: {prompt}\n")
started = time.perf_counter()
first_text_at = None

# .stream() sends the answer piece by piece instead of all at once at the end
with client.messages.stream(
    model=MODEL,
    max_tokens=4096,
    messages=[{"role": "user", "content": prompt}],
) as stream:
    for text in stream.text_stream:
        if first_text_at is None:
            first_text_at = time.perf_counter()
        print(text, end="", flush=True)  # flush=True shows each piece immediately

    # get_final_message() gives you the complete response once the stream has finished
    final = stream.get_final_message()

finished = time.perf_counter()
print("\n\n--- Timing ---")
print(f"First text after: {first_text_at - started:.1f}s")
print(f"Finished after:   {finished - started:.1f}s")
print(f"Output tokens:    {final.usage.output_tokens}")
