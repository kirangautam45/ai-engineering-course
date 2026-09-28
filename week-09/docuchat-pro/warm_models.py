"""Downloads the local AI models during the BUILD, so the first visitor doesn't wait for them.

Run: python run.py warm-models  (render.yaml runs it after installing the packages)
"""

import os

from ailib.embeddings import EMBEDDING_MODEL, PROVIDER, embed
from ailib.rerank import RERANK_MODEL, rerank

if PROVIDER == "local":
    # Hosted providers have nothing to download
    embed("warm up")
    print(f"✅ {EMBEDDING_MODEL}")
if os.getenv("RERANK") != "off":
    rerank("warm up", [{"text": "warm up"}])
    print(f"✅ {RERANK_MODEL}")
