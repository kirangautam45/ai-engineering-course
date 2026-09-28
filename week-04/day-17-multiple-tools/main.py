"""Day 17 — Multiple tools, parallel calls and errors

Run: python run.py day17 "What's the weather in Kathmandu and Pokhara, and how much is 250 USD in NPR?"
"""

import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ailib.claude import MODEL, client, text_of

sys.path.insert(0, str(Path(__file__).parent))
from services import convert_currency, get_weather  # noqa: E402

tools = [
    {
        "name": "get_weather",
        "description": (
            "Get the current weather for one city: temperature, humidity, rain and wind. "
            "Call it once per city. For several cities, call it several times in the same turn."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"city": {"type": "string", "description": 'City name only, e.g. "Pokhara" or "Delhi"'}},
            "required": ["city"],
        },
    },
    {
        "name": "convert_currency",
        "description": "Convert an amount of money between currencies using today's exchange rate.",
        "input_schema": {
            "type": "object",
            "properties": {
                "amount": {"type": "number"},
                "from_currency": {"type": "string", "description": "3-letter currency code, e.g. USD"},
                "to_currency": {"type": "string", "description": "3-letter currency code, e.g. NPR"},
            },
            "required": ["amount", "from_currency", "to_currency"],
        },
    },
]

# Map each tool name to the function that runs it
handlers = {"get_weather": get_weather, "convert_currency": convert_currency}


def run_tool(block) -> dict:
    call = f"{block.name}({json.dumps(block.input)})"
    try:
        handler = handlers.get(block.name)
        if handler is None:
            raise ValueError(f"Unknown tool: {block.name}")
        content = handler(**block.input)
        print(f"  ✅ {call}")
        return {"type": "tool_result", "tool_use_id": block.id, "content": content}
    except Exception as error:  # noqa: BLE001 — any failure goes back to the model, not up to the user
        # Tell the model what went wrong, so it can fix its input or explain it to the user
        print(f"  ❌ {call}: {error}")
        return {"type": "tool_result", "tool_use_id": block.id, "content": str(error), "is_error": True}


question = " ".join(sys.argv[1:]) or "What's the weather in Kathmandu and Pokhara right now, and how much is 250 USD in NPR?"
messages = [{"role": "user", "content": question}]
print(f"🙋 {question}\n")

for turn in range(1, 11):
    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system="You are a helpful travel assistant for Nepal. Use the tools for live data; never guess numbers.",
        tools=tools,
        messages=messages,
    )
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason != "tool_use":
        print(f"\n🤖 {text_of(response)}")
        break

    calls = [block for block in response.content if block.type == "tool_use"]
    print(f"Turn {turn}: the model asked for {len(calls)} tool call(s)")

    # Run them all at the same time (in threads), then send ALL results back in ONE message
    with ThreadPoolExecutor() as pool:
        results = list(pool.map(run_tool, calls))
    messages.append({"role": "user", "content": results})
