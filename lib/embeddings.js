// Turns text into embeddings (lists of numbers that capture meaning).
//
// By default a free model runs LOCALLY with Transformers.js: no API key, no cost, works offline
// after the first download (~120 MB, cached inside node_modules). It needs about 700 MB of memory,
// so for small servers (e.g. a 512 MB free hosting plan) use a hosted provider instead:
//
//   EMBEDDING_PROVIDER=local | openai | qwen      (in .env)
//   EMBEDDING_DIMENSIONS=512                      (hosted providers only; optional)
//
// Vectors from different models can't be compared: after switching, re-run the ingestion
// (npm run day27). lib/vector-store.js notices the change, re-embeds and updates the index.
import { pipeline } from "@huggingface/transformers";
import { openAIClientFor } from "./llm.js"; // also loads .env

const PROVIDER = (process.env.EMBEDDING_PROVIDER ?? "local").toLowerCase();

const HOSTED = {
  openai: { model: "text-embedding-3-small", defaultDimensions: 512, batchSize: 100 },
  qwen: { model: "text-embedding-v4", defaultDimensions: 512, batchSize: 10 }, // Qwen allows 10 texts per request
};

const LOCAL_MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

if (PROVIDER !== "local" && !HOSTED[PROVIDER]) {
  throw new Error(`Unknown EMBEDDING_PROVIDER "${PROVIDER}". Use local, openai or qwen.`);
}

// The local model understands 50+ languages, including Nepali, and makes vectors of 384 numbers.
// It reads at most 128 tokens (roughly 80–100 words) per text; anything longer is cut off.
export const DIMENSIONS =
  PROVIDER === "local" ? 384 : Number(process.env.EMBEDDING_DIMENSIONS ?? HOSTED[PROVIDER].defaultDimensions);

// Saved with every vector, so we can tell which model made it
export const EMBEDDING_MODEL = PROVIDER === "local" ? LOCAL_MODEL : `${PROVIDER}:${HOSTED[PROVIDER].model}@${DIMENSIONS}`;

let extractor; // the local model, loaded once on first use

// Pass one string or an array of strings; always returns an array of vectors.
export async function embed(texts) {
  const input = [texts].flat();

  if (PROVIDER === "local") {
    extractor ??= await pipeline("feature-extraction", LOCAL_MODEL, { dtype: "q8" });
    const output = await extractor(input, { pooling: "mean", normalize: true });
    return output.tolist();
  }

  // Hosted: OpenAI and Qwen both use the OpenAI-compatible embeddings endpoint
  const { model, batchSize } = HOSTED[PROVIDER];
  const vectors = [];
  for (let i = 0; i < input.length; i += batchSize) {
    const response = await openAIClientFor(PROVIDER).embeddings.create({
      model,
      input: input.slice(i, i + batchSize),
      dimensions: DIMENSIONS,
      encoding_format: "float",
    });
    vectors.push(...response.data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
  }
  return vectors;
}

// How similar two vectors are, from -1 (opposite) to 1 (same direction).
export function cosineSimilarity(a, b) {
  let dot = 0;
  let lengthA = 0;
  let lengthB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    lengthA += a[i] * a[i];
    lengthB += b[i] * b[i];
  }
  return dot / (Math.sqrt(lengthA) * Math.sqrt(lengthB));
}
