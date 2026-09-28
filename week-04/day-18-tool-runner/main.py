"""Day 18 — The tool runner: let the SDK run the loop

Run: python run.py day18 "Compare the weather in Kathmandu, Pokhara and Lukla, and convert 500 USD to NPR"
"""

import json
import sys
from pathlib import Path
from typing import Annotated

from anthropic import beta_tool
from pydantic import Field

from ailib.claude import MODEL, client, text_of

sys.path.insert(0, str(Path(__file__).parent.parent / "day-17-multiple-tools"))
import services  # noqa: E402  — the same functions as Day 17


# A tool is now ONE decorated function. The SDK builds the tool's JSON schema from the type hints,
# and the descriptions from the docstring. It also checks the model's input before calling it.
@beta_tool
def get_weather(city: str) -> str:
    """Get the current weather for one city. For several cities, call it several times in the same turn.

    Args:
        city: City name only, e.g. "Pokhara".
    """
    return services.get_weather(city)  # if this raises, the runner sends the error back with is_error


@beta_tool
def convert_currency(
    amount: Annotated[float, Field(gt=0)],
    from_currency: Annotated[str, Field(min_length=3, max_length=3)],
    to_currency: Annotated[str, Field(min_length=3, max_length=3)],
) -> str:
    """Convert an amount of money between currencies using today's exchange rate.

    Args:
        amount: How much money (more than 0).
        from_currency: 3-letter currency code, e.g. USD.
        to_currency: 3-letter currency code, e.g. NPR.
    """
    return services.convert_currency(amount, from_currency, to_currency)


question = " ".join(sys.argv[1:]) or "Compare the weather in Kathmandu, Pokhara and Lukla right now, and convert 500 USD to NPR."
print(f"🙋 {question}\n")

runner = client.beta.messages.tool_runner(
    model=MODEL,
    max_tokens=4096,
    system="You are a helpful travel assistant for Nepal. Use the tools for live data; never guess numbers.",
    tools=[get_weather, convert_currency],
    messages=[{"role": "user", "content": question}],
    max_iterations=10,  # safety limit: stop after 10 model calls even if it keeps asking for tools
)

# You can simply call runner.until_done() to get the final message.
# Looping over the runner instead lets us watch each step as it happens.
final = None
for message in runner:
    for block in message.content:
        if block.type == "tool_use":
            print(f"🔧 {block.name}({json.dumps(block.input)})")
    final = message

print(f"\n🤖 {text_of(final)}")
print(f"\n(stop_reason: {final.stop_reason})")
