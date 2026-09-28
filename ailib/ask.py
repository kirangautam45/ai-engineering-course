"""ask() — send one question and get back text you can trust.

Built on Day 5; later lessons reuse it.
"""

from ailib.claude import MODEL, client, text_of


def ask(prompt: str, *, system: str | None = None, max_tokens: int = 2048) -> str:
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        **({"system": system} if system else {}),
        messages=[{"role": "user", "content": prompt}],
        # If the model declines a request for safety reasons, the API retries it on a
        # recommended fallback model automatically instead of just refusing.
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    )

    # Always check WHY the model stopped before trusting the answer
    match response.stop_reason:
        case "end_turn":
            return text_of(response)
        case "max_tokens":
            return text_of(response) + "\n\n[⚠️ Answer was cut off — increase max_tokens]"
        case "refusal":
            return "[The model declined to answer this request.]"
        case other:
            return f"[Stopped early: {other}]"
