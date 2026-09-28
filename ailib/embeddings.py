"""Turn text into embeddings (lists of numbers that capture meaning).

By default a free model runs LOCALLY with fastembed: no API key, no cost, works offline after the
first download (~220 MB, cached in .cache/fastembed). It needs about 1 GB of memory, so for small
servers (e.g. a 512 MB free hosting plan) use a hosted provider instead:

    EMBEDDING_PROVIDER=local | openai | qwen      (in .env)
    EMBEDDING_DIMENSIONS=512                      (hosted providers only; optional)

Vectors from different models can't be compared: after switching, re-run the ingestion
(python run.py day27). ailib/vector_store.py notices the change, re-embeds and rebuilds the index.
"""

import os
from pathlib import Path

import numpy as np

import ailib.env  # noqa: F401 — loads .env

PROVIDER = os.getenv("EMBEDDING_PROVIDER", "local").lower()

HOSTED = {
    "openai": {"model": "text-embedding-3-small", "default_dimensions": 512, "batch_size": 100},
    "qwen": {"model": "text-embedding-v4", "default_dimensions": 512, "batch_size": 10},  # Qwen allows 10 texts per request
}

LOCAL_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CACHE_DIR = Path(os.getenv("MODEL_CACHE_DIR", ".cache/fastembed"))  # models are downloaded here once

if PROVIDER != "local" and PROVIDER not in HOSTED:
    raise ValueError(f'Unknown EMBEDDING_PROVIDER "{PROVIDER}". Use local, openai or qwen.')

# The local model understands 50+ languages, including Nepali, and makes vectors of 384 numbers.
# It reads at most 128 tokens (roughly 80–100 words) per text; anything longer is cut off.
DIMENSIONS = 384 if PROVIDER == "local" else int(os.getenv("EMBEDDING_DIMENSIONS", HOSTED[PROVIDER]["default_dimensions"]))

# Saved with every vector, so we can tell which model made it
EMBEDDING_MODEL = LOCAL_MODEL if PROVIDER == "local" else f"{PROVIDER}:{HOSTED[PROVIDER]['model']}@{DIMENSIONS}"

_local_model = None  # loaded once, on first use


def embed(texts: str | list[str]) -> list[list[float]]:
    """Pass one string or a list of strings; always returns a list of vectors."""
    global _local_model
    texts = [texts] if isinstance(texts, str) else list(texts)

    if PROVIDER == "local":
        if _local_model is None:
            from fastembed import TextEmbedding  # imported here so hosted setups never load it

            _local_model = TextEmbedding(LOCAL_MODEL, cache_dir=str(CACHE_DIR))
        return [vector.tolist() for vector in _local_model.embed(texts)]

    # Hosted: OpenAI and Qwen both use the OpenAI-compatible embeddings endpoint
    from ailib.llm import openai_client_for

    settings = HOSTED[PROVIDER]
    vectors = []
    for start in range(0, len(texts), settings["batch_size"]):
        response = openai_client_for(PROVIDER).embeddings.create(
            model=settings["model"],
            input=texts[start : start + settings["batch_size"]],
            dimensions=DIMENSIONS,
            encoding_format="float",
        )
        vectors.extend(item.embedding for item in sorted(response.data, key=lambda d: d.index))
    return vectors


def cosine_similarity(a, b) -> float:
    """How similar two vectors are, from -1 (opposite) to 1 (same direction)."""
    a, b = np.asarray(a), np.asarray(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))
