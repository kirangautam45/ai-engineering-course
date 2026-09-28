# Day 21: What Are Embeddings?

Keyword search only finds exact words: search "vehicle" and you'll miss "bus". This week you build search that understands **meaning**, and it starts with embeddings.

## What you will learn

- An **embedding** is a list of numbers that represents the meaning of a piece of text
- Texts with similar meanings get vectors that point in similar directions
- **Cosine similarity**: how to measure that, in a few lines of Python
- Why embeddings work across languages: "I forgot my password" and "पासवर्ड बिर्सिएँ" land close together

## Run it

```bash
python run.py day21
```

The first run downloads a free embedding model (about 220 MB, saved in `.cache/fastembed`). After that it works offline and costs nothing: this week's lessons don't need an API key at all.

## The idea in one picture

Imagine describing words with 3 scores: *is it an animal? is it food? is it a vehicle?*

| Word | Animal | Food | Vehicle |
|---|---|---|---|
| dog | 0.9 | 0.1 | 0.0 |
| cat | 0.95 | 0.05 | 0.0 |
| momo | 0.0 | 0.95 | 0.0 |
| bus | 0.0 | 0.0 | 0.9 |

`dog` and `cat` point the same way, so they're similar. `dog` and `bus` point in completely different directions. A real embedding model does the same thing with **384** scores that it learned from millions of sentences, not 3 that we picked by hand.

## Cosine similarity

In [`ailib/embeddings.py`](../../ailib/embeddings.py), using NumPy:

```python
def cosine_similarity(a, b) -> float:
    a, b = np.asarray(a), np.asarray(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))
```

`a @ b` is the **dot product**: multiply the numbers pair by pair and add them up. Dividing by both lengths (`np.linalg.norm`) means only the vectors' **direction** counts, not how long they are. Written out by hand, it's the same as:

```python
dot = sum(x * y for x, y in zip(a, b))
length_a = sum(x * x for x in a) ** 0.5
length_b = sum(y * y for y in b) ** 0.5
similarity = dot / (length_a * length_b)
```

The result goes from -1 (opposite meanings) to 1 (same meaning). It only cares about **direction**, not length.

## Walkthrough

1. **Part 1** runs cosine similarity on the hand-made vectors above.
2. **Part 2** embeds 7 real sentences and ranks every pair. The password questions (English and Nepali) pair up, and so do the two bus questions, even though they share almost no words.
3. **Part 3** compares a keyword search for "vehicle" (finds only 1 sentence) with semantic search, which also finds "The bus to Pokhara leaves at 7 AM".

## Reading the scores

With this model, unrelated sentences score close to 0 and closely related ones 0.6 or higher. Every model spreads its scores differently, so **don't compare raw numbers across models**, and don't hard-code a "good match" threshold without testing it. What matters most is the **ranking**: which texts score highest for a given query.

## Try it

- Add sentences in Romanized Nepali ("password birsiye"). Do they still match?
- Add "The bus has a flat tyre". Is it closer to the Pokhara sentences or not? Why?
- Embed "bank" (money) and "river bank". How can one word have two meanings in the same space?

## Homework

Embed 20 sentences of your own (mix topics and languages) and print the closest pair for each sentence. Find one result that surprised you and explain it.
