"""Day 3 — System prompts and multi-turn chat

Run: python run.py day3   (type "exit" to quit)
"""

from ailib.claude import MODEL, client, text_of

# The system prompt sets the assistant's role and rules for the whole conversation
SYSTEM = """You are a friendly Python tutor for beginner students.
Keep answers short: at most 5 sentences, plus a code example when it helps.
If a question is not about programming, politely steer back to Python."""

# The API has no memory. WE keep the history and send all of it every time.
history = []

print('Python Tutor ready! Type "exit" to quit.\n')

while True:
    question = input("You: ").strip()
    if not question:
        continue
    if question.lower() == "exit":
        break

    history.append({"role": "user", "content": question})

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM,
        messages=history,
    )

    answer = text_of(response)
    history.append({"role": "assistant", "content": answer})

    print(f"\nTutor: {answer}\n")
    print(f"(history: {len(history)} messages, {response.usage.input_tokens} input tokens)\n")
