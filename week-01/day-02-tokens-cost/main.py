"""Day 2 — Tokens and cost

Run: python run.py day2 "Namaste! How many tokens is this sentence?"
"""

import sys

from ailib.claude import MODEL, client, text_of

# Price per 1 million tokens in US dollars. Check the latest prices at
# https://www.anthropic.com/pricing and update these if they change.
PRICE_PER_MILLION = {"input": 5, "output": 25}  # claude-opus-5

text = " ".join(sys.argv[1:]) or "Namaste! How many tokens is this sentence?"
messages = [{"role": "user", "content": text}]

# 1. Count tokens BEFORE sending — this call is free and doesn't generate anything
count = client.messages.count_tokens(model=MODEL, messages=messages)
print(f"Your prompt is {count.input_tokens} tokens ({len(text)} characters).")

# 2. Send the real request
response = client.messages.create(model=MODEL, max_tokens=1024, messages=messages)
print("\nAnswer:\n" + text_of(response))

# 3. Work out what it cost
usage = response.usage
cost = (
    usage.input_tokens / 1_000_000 * PRICE_PER_MILLION["input"]
    + usage.output_tokens / 1_000_000 * PRICE_PER_MILLION["output"]
)

print("\n--- Bill ---")
print(f"Input:  {usage.input_tokens} tokens")
print(f"Output: {usage.output_tokens} tokens")
print(f"Cost:   ${cost:.6f}  (about {round(1 / cost)} of these per dollar)")
