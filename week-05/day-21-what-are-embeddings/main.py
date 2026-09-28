"""Day 21 — What are embeddings?

Run: python run.py day21
"""

from itertools import combinations

from ailib.embeddings import cosine_similarity, embed

# ---- Part 1: similarity with tiny hand-made vectors -------------------------
# Imagine each word described by 3 scores: [is it an animal?, is it food?, is it a vehicle?]
toy = {
    "dog": [0.9, 0.1, 0.0],
    "cat": [0.95, 0.05, 0.0],
    "momo": [0.0, 0.95, 0.0],
    "bus": [0.0, 0.0, 0.9],
}
print("Part 1: hand-made vectors")
for other in ["cat", "momo", "bus"]:
    print(f"  dog vs {other + ':':6} {cosine_similarity(toy['dog'], toy[other]):.2f}")

# ---- Part 2: real embeddings from a model ------------------------------------
sentences = [
    "How do I reset my password?",
    "I forgot my login details",
    "पासवर्ड बिर्सिएँ, के गर्ने?",  # "I forgot my password, what do I do?" in Nepali
    "The canteen serves momo on Fridays",
    "What's for lunch today?",
    "The bus to Pokhara leaves at 7 AM",
    "When does the next vehicle to Pokhara depart?",
]

print("\nPart 2: loading the embedding model (the first run downloads it)...")
vectors = embed(sentences)
print(f"Each sentence became {len(vectors[0])} numbers. The first five of sentence 1:")
print("  " + ", ".join(f"{n:.3f}" for n in vectors[0][:5]) + " ...")

# Compare every pair and show the most and least similar
pairs = sorted(
    ((cosine_similarity(vectors[i], vectors[j]), sentences[i], sentences[j]) for i, j in combinations(range(len(sentences)), 2)),
    reverse=True,
)
print("\nMost similar pairs:")
for score, a, b in pairs[:4]:
    print(f'  {score:.3f}  "{a}"  ↔  "{b}"')
print("\nLeast similar pairs:")
for score, a, b in pairs[-3:]:
    print(f'  {score:.3f}  "{a}"  ↔  "{b}"')

# ---- Part 3: keyword search vs semantic search -----------------------------
question = "vehicle to Pokhara"
print(f'\nPart 3: searching for "{question}"')

keyword_hits = [s for s in sentences if "vehicle" in s.lower()]
print(f'  Keyword search for "vehicle" finds: {keyword_hits}')

[query_vector] = embed(question)
ranked = sorted(((cosine_similarity(query_vector, v), s) for s, v in zip(sentences, vectors)), reverse=True)
print("  Semantic search ranks:")
for score, sentence in ranked[:3]:
    print(f'    {score:.3f}  "{sentence}"')
