// Turns text into embeddings (lists of numbers that capture meaning).
// Runs a free model LOCALLY with Transformers.js: no API key, no cost, works offline
// after the first download (~120 MB, cached inside node_modules).
import { pipeline } from "@huggingface/transformers";

// This model understands 50+ languages, including Nepali, and makes vectors of 384 numbers.
// It reads at most 128 tokens (roughly 80–100 words) per text; anything longer is cut off.
// Change it here and every lesson uses the new model.
export const EMBEDDING_MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
export const DIMENSIONS = 384;

let extractor; // loaded once, on first use

// Pass one string or an array of strings; always returns an array of vectors.
export async function embed(texts) {
  extractor ??= await pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: "q8" });
  const output = await extractor([texts].flat(), { pooling: "mean", normalize: true });
  return output.tolist();
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
