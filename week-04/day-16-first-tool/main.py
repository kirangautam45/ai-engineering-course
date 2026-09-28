"""Day 16 — Your first tool: a calculator

Run: python run.py day16 "What is 18% VAT on NPR 45,999, and what's the total?"
"""

import json
import sys

from ailib.claude import MODEL, client, text_of

# 1. DESCRIBE the tool. The model only sees this description, never your code.
tools = [
    {
        "name": "calculate",
        "description": (
            "Do one arithmetic operation on two numbers. Use this for any maths instead of calculating in your head, "
            "because exact answers matter. For multi-step problems, call it once per step."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "The first number"},
                "b": {"type": "number", "description": "The second number"},
                "operation": {"type": "string", "enum": ["add", "subtract", "multiply", "divide"]},
            },
            "required": ["a", "b", "operation"],
        },
    }
]


# 2. IMPLEMENT the tool. This is normal Python that runs on YOUR computer.
def calculate(a: float, b: float, operation: str) -> float:
    if operation == "add":
        return a + b
    if operation == "subtract":
        return a - b
    if operation == "multiply":
        return a * b
    if operation == "divide":
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b
    raise ValueError(f"Unknown operation: {operation}")


question = " ".join(sys.argv[1:]) or "What is 18% VAT on NPR 45,999, and what's the total?"
messages = [{"role": "user", "content": question}]
print(f"🙋 {question}\n")

# 3. THE LOOP: ask → if the model wants a tool, run it and send back the result → ask again
for turn in range(10):
    response = client.messages.create(model=MODEL, max_tokens=4096, tools=tools, messages=messages)

    # The model's reply (including any tool requests) becomes part of the history
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason != "tool_use":
        print(f"\n🤖 {text_of(response)}")
        break

    # Run every tool the model asked for and collect the results
    results = []
    for block in response.content:
        if block.type != "tool_use":
            continue
        call = f"calculate({json.dumps(block.input)})"
        try:
            answer = calculate(**block.input)
            print(f"🔧 {call} = {answer}")
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": str(answer)})
        except (ValueError, TypeError) as error:
            print(f"⚠️  {call} failed: {error}")
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": str(error), "is_error": True})

    # Tool results go back as a USER message — they're information for the model to read
    messages.append({"role": "user", "content": results})
