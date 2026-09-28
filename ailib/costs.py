"""Work out what a request cost from its `usage`. Prices are US dollars per million tokens.

Check https://www.anthropic.com/pricing and update this table when prices change.
"""

PRICES = {
    "claude-opus-5": {"input": 5, "output": 25},
    "claude-sonnet-5": {"input": 2, "output": 10},
    "claude-haiku-4-5": {"input": 1, "output": 5},
}

# Prompt caching: writing to the cache costs 1.25× the input price (5-minute cache),
# reading from it costs only 0.1×.
CACHE_WRITE = 1.25
CACHE_READ = 0.1


def _get(usage, name: str) -> int:
    """Works with the SDK's usage object and with plain dicts."""
    value = usage.get(name) if isinstance(usage, dict) else getattr(usage, name, None)
    return value or 0


def cost_of(usage, model: str) -> float | None:
    price = PRICES.get(model)
    if price is None:
        return None  # unknown model: add it to PRICES
    per_token = 1 / 1_000_000
    return (
        _get(usage, "input_tokens") * price["input"] * per_token
        + _get(usage, "cache_creation_input_tokens") * price["input"] * CACHE_WRITE * per_token
        + _get(usage, "cache_read_input_tokens") * price["input"] * CACHE_READ * per_token
        + _get(usage, "output_tokens") * price["output"] * per_token
    )


def cost_without_cache(usage, model: str) -> float | None:
    """What the same request would have cost with no caching at all."""
    all_input = sum(_get(usage, n) for n in ("input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"))
    return cost_of({"input_tokens": all_input, "output_tokens": _get(usage, "output_tokens")}, model)
