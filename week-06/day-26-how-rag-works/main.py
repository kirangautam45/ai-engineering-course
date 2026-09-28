"""Day 26 — How RAG works: the same question with and without retrieved context

Run: python run.py day26 "Which free weather and exchange rate APIs are used, and do they need a key?"
"""

import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ailib.chunking import chunk_by_size
from ailib.claude import MODEL, client, text_of
from ailib.embeddings import cosine_similarity, embed

question = " ".join(sys.argv[1:]) or "Which free weather and exchange rate APIs are used, and do they need a key?"
TOP_K = 4

# ---- R: RETRIEVE ------------------------------------------------------------
# Our "knowledge base" is this course's own lesson READMEs. The model has never seen them.
chunks = [
    {"file": str(file), "text": chunk["text"]}
    for file in sorted(Path(".").glob("week-*/day-*/README.md"))
    for chunk in chunk_by_size(file.read_text(encoding="utf-8"))
]

question_vector, *chunk_vectors = embed([question] + [c["text"] for c in chunks])
retrieved = sorted(
    ({**chunk, "score": cosine_similarity(question_vector, vector)} for chunk, vector in zip(chunks, chunk_vectors)),
    key=lambda c: c["score"],
    reverse=True,
)[:TOP_K]

print(f"🙋 {question}\n\n📚 Retrieved {TOP_K} of {len(chunks)} chunks:")
for r in retrieved:
    print(f"  {r['score']:.3f}  {r['file']}")

# ---- A: AUGMENT -------------------------------------------------------------
# Put the retrieved text into the prompt, clearly separated from the question
context = "\n".join(
    f'<document index="{i}" source="{r["file"]}">\n{r["text"]}\n</document>' for i, r in enumerate(retrieved, start=1)
)
augmented_prompt = f"""<documents>
{context}
</documents>

Answer the question using only the documents above. If they don't contain the answer, say you don't know.

Question: {question}"""


# ---- G: GENERATE ------------------------------------------------------------
def ask(prompt: str) -> tuple[str, int]:
    response = client.messages.create(model=MODEL, max_tokens=1024, messages=[{"role": "user", "content": prompt}])
    return text_of(response), response.usage.input_tokens


with ThreadPoolExecutor() as pool:  # ask both at the same time
    (without_rag, tokens_without), (with_rag, tokens_with) = pool.map(ask, [question, augmented_prompt])

print(f"\n==================== Without RAG ({tokens_without} input tokens) ====================")
print(without_rag)
print(f"\n==================== With RAG ({tokens_with} input tokens) ====================")
print(with_rag)
