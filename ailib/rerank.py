"""Reranking with a local cross-encoder model (free, runs on your computer, no API key).

An embedding model reads the question and each chunk SEPARATELY. A cross-encoder reads
them TOGETHER, so it judges relevance much better, but it's too slow to run on every chunk.
So: retrieve ~20 candidates quickly, then rerank only those.
"""

import os
from pathlib import Path

# Small (80 MB) and fast, but English only.
# For Nepali and other languages use "jinaai/jina-reranker-v2-base-multilingual" (1.1 GB download).
RERANK_MODEL = os.getenv("RERANK_MODEL", "Xenova/ms-marco-MiniLM-L-6-v2")
CACHE_DIR = Path(os.getenv("MODEL_CACHE_DIR", ".cache/fastembed"))

_model = None  # loaded once, on first use


def rerank(question: str, candidates: list[dict], top: int = 5) -> list[dict]:
    """Returns the chunks sorted by relevance, each with a "rerank_score" (higher = more relevant)."""
    global _model
    if not candidates:
        return []
    if _model is None:
        from fastembed.rerank.cross_encoder import TextCrossEncoder

        _model = TextCrossEncoder(RERANK_MODEL, cache_dir=str(CACHE_DIR))

    # One (question, chunk) pair per candidate, scored together
    scores = list(_model.rerank(question, [c["text"] for c in candidates]))
    ranked = sorted(({**chunk, "rerank_score": float(score)} for chunk, score in zip(candidates, scores)),
                    key=lambda c: c["rerank_score"], reverse=True)
    return ranked[:top]
