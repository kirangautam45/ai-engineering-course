"""Day 6 — Anatomy of a good prompt

Run: python run.py day6
Sends the SAME customer review with three prompts, from vague to clear, and prints the answers side by side.
"""

import asyncio

from ailib.claude import MODEL, async_client, text_of

review = """Ordered the chicken momo set on Friday night. Food took 55 minutes, arrived cold,
and the achar was missing. The rider was polite though. The momos themselves tasted great once
I reheated them. Called support twice, nobody picked up. Probably won't order again unless this is fixed."""

prompts = {
    "1. Vague": f"Summarize this: {review}",
    "2. Specific": f"""Summarize this customer review in 2 bullet points: what went wrong, and what went well.

{review}""",
    # Role + task + context + constraints + output format, with the REASON for each rule
    "3. Full anatomy": f"""You are helping the operations team of a food delivery app in Kathmandu.
They read hundreds of reviews a day, so they need summaries they can act on in seconds.

<review>
{review}
</review>

Write a summary with exactly these three lines:
Problems: the specific failures, so the team knows what to fix
Positives: anything the customer liked, so the team knows what to keep
Risk: "high", "medium" or "low" chance we lose this customer, with a 5-word reason

Keep each line under 20 words. Don't add anything else, because this goes straight into a dashboard.""",
}


async def run(name: str, prompt: str) -> tuple[str, str, int]:
    response = await async_client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return name, text_of(response), response.usage.output_tokens


async def main() -> None:
    # Run all three at the same time — they don't depend on each other
    results = await asyncio.gather(*(run(name, prompt) for name, prompt in prompts.items()))
    for name, answer, tokens in results:
        print(f"\n==================== {name} ({tokens} output tokens) ====================")
        print(answer)


asyncio.run(main())
