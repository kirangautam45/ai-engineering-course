// Reranking with a local cross-encoder model (free, runs on your computer, no API key).
// An embedding model reads the question and each chunk SEPARATELY. A cross-encoder reads
// them TOGETHER, so it judges relevance much better, but it's too slow to run on every chunk.
// So: retrieve ~20 candidates quickly, then rerank only those.
import { AutoTokenizer, AutoModelForSequenceClassification } from "@huggingface/transformers";

// Small (23 MB) and fast, but English only.
// For Nepali and other languages use "onnx-community/bge-reranker-v2-m3-ONNX" (576 MB download).
export const RERANK_MODEL = "Xenova/ms-marco-MiniLM-L-6-v2";

let tokenizer;
let model;

// Returns the chunks sorted by relevance, each with a `rerankScore` (higher = more relevant)
export async function rerank(question, candidates, { top = 5 } = {}) {
  if (candidates.length === 0) return [];
  tokenizer ??= await AutoTokenizer.from_pretrained(RERANK_MODEL);
  model ??= await AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL, { dtype: "q8" });

  // One (question, chunk) pair per candidate
  const inputs = tokenizer(new Array(candidates.length).fill(question), {
    text_pair: candidates.map((c) => c.text),
    padding: true,
    truncation: true,
  });
  const { logits } = await model(inputs);
  const scores = logits.tolist().map(([score]) => score);

  return candidates
    .map((chunk, i) => ({ ...chunk, rerankScore: scores[i] }))
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, top);
}
