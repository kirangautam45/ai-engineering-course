"""Day 1 — Your first LLM API call

Run: python run.py day1 "Explain what an API is in one sentence"
"""

import sys

from ailib.claude import MODEL, client, text_of

# Everything after `python run.py day1` becomes the question
question = " ".join(sys.argv[1:]) or "Say hello to a new AI engineering student!"

response = client.messages.create(
    model=MODEL,
    max_tokens=1024,
    messages=[{"role": "user", "content": question}],
)

print("Question:", question)
print("\nAnswer:\n" + text_of(response))

# Peek at the rest of the response object — this is what the API really sends back
print("\n--- Behind the scenes ---")
print("Model:", response.model)
print("Stop reason:", response.stop_reason)
print("Tokens in / out:", response.usage.input_tokens, "/", response.usage.output_tokens)
