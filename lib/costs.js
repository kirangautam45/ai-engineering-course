// Work out what a request cost from its `usage`. Prices are US dollars per million tokens.
// Check https://www.anthropic.com/pricing and update this table when prices change.
const PRICES = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

// Prompt caching: writing to the cache costs 1.25× the input price (5-minute cache),
// reading from it costs only 0.1×.
const CACHE_WRITE = 1.25;
const CACHE_READ = 0.1;

export function costOf(usage, model) {
  const price = PRICES[model];
  if (!price) return null; // unknown model: add it to PRICES
  const perToken = (dollarsPerMillion) => dollarsPerMillion / 1_000_000;
  return (
    usage.input_tokens * perToken(price.input) +
    (usage.cache_creation_input_tokens ?? 0) * perToken(price.input * CACHE_WRITE) +
    (usage.cache_read_input_tokens ?? 0) * perToken(price.input * CACHE_READ) +
    usage.output_tokens * perToken(price.output)
  );
}

// What the same request would have cost with no caching at all
export function costWithoutCache(usage, model) {
  const allInput = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  return costOf({ input_tokens: allInput, output_tokens: usage.output_tokens }, model);
}
