"""Day 10 — 🛠️ Practice: a prompt library with automated tests

Run: python run.py day10                (all prompts)
     python run.py day10 classifier     (one prompt)
"""

import asyncio
import sys
from pathlib import Path

from ailib.claude import MODEL, async_client, text_of

sys.path.insert(0, str(Path(__file__).parent))  # so we can import the prompts/ folder
from prompts import classifier, extractor, summarizer  # noqa: E402

ALL_PROMPTS = [classifier, summarizer, extractor]
only = sys.argv[1] if len(sys.argv) > 1 else None
prompts = [p for p in ALL_PROMPTS if p.NAME == only] if only else ALL_PROMPTS


async def run(prompt, test: dict):
    """Run one test case: send the input, get the output (text, or a parsed object)."""
    request = dict(
        model=MODEL,
        max_tokens=1024,
        system=prompt.SYSTEM,
        output_config={"effort": prompt.EFFORT},
        messages=[{"role": "user", "content": prompt.build(test["input"])}],
    )
    schema = getattr(prompt, "SCHEMA", None)
    if schema:
        response = await async_client.messages.parse(**request, output_format=schema)
        return response.parsed_output
    return text_of(await async_client.messages.create(**request))


async def run_and_check(prompt, test: dict) -> tuple[dict, object, bool | str]:
    try:
        output = await run(prompt, test)
        verdict = "no output" if output is None else prompt.check(output, test)
    except Exception as error:  # a failed request shouldn't stop the other tests
        output, verdict = None, f"error: {error}"
    return test, output, verdict


async def main() -> None:
    passed = total = 0
    for prompt in prompts:
        print(f"\n📝 {prompt.NAME} (v{prompt.VERSION})")
        # Run every test case for this prompt at the same time
        results = await asyncio.gather(*(run_and_check(prompt, test) for test in prompt.TESTS))
        for test, output, verdict in results:
            total += 1
            ok = verdict is True
            passed += ok
            shown = output.model_dump() if hasattr(output, "model_dump") else output
            text = " ".join(test["input"].split())[:50]
            print(f"  {'✅' if ok else '❌'} {text:<50} → {shown!r}")
            if not ok:
                print(f"     {verdict}")

    print(f"\nScore: {passed}/{total} passed")
    sys.exit(0 if passed == total else 1)  # a non-zero exit fails a CI build


asyncio.run(main())
