"""Day 8 — Thinking and effort

Run: python run.py day8
Asks the same puzzle at "low" and "high" effort and compares answer, thinking, tokens and time.
"""

import time

from ailib.claude import MODEL, client, text_of

puzzle = """Four friends — Aarav, Bina, Chirag and Diya — sit in a row of 4 seats (numbered 1 to 4, left to right).
- Bina is not at either end.
- Aarav sits somewhere to the right of Diya.
- Chirag sits directly next to Diya.
- Aarav is not in seat 3.
- Chirag is not in seat 1.
Who sits in each seat? Give the final answer as: 1=?, 2=?, 3=?, 4=?"""


def solve(effort: str) -> dict:
    started = time.perf_counter()
    response = client.messages.create(
        model=MODEL,
        max_tokens=16000,
        # Adaptive thinking: the model decides when and how much to think.
        # display: "summarized" returns a readable summary of that thinking.
        thinking={"type": "adaptive", "display": "summarized"},
        # effort controls how hard it tries: low | medium | high | xhigh | max
        output_config={"effort": effort},
        messages=[{"role": "user", "content": puzzle}],
    )
    thinking = "\n".join(block.thinking for block in response.content if block.type == "thinking")
    return {
        "seconds": time.perf_counter() - started,
        "output_tokens": response.usage.output_tokens,
        "thinking": thinking,
        "answer": text_of(response),
    }


for effort in ["low", "high"]:
    result = solve(effort)
    print(f"\n==================== effort: {effort} ====================")
    print(f"💭 Thinking summary:\n{result['thinking'] or '(no thinking needed)'}")
    print(f"\n✅ Answer:\n{result['answer']}")
    print(f"\n⏱️  {result['seconds']:.1f}s · {result['output_tokens']} output tokens (thinking counts as output)")
