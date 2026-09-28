# Day 21: What Are Embeddings?

Keyword search only finds exact words: search "vehicle" and you'll miss "bus". This week you build search that understands **meaning**, and it starts with embeddings.

## What you will learn

- An **embedding** is a list of numbers that represents the meaning of a piece of text
- Texts with similar meanings get vectors that point in similar directions
- **Cosine similarity**: how to measure that, in 10 lines of JavaScript
- Why embeddings work across languages: "I forgot my password" and "पासवर्ड बिर्सिएँ" land close together

## Run it

```bash
npm run day21
```

The first run downloads a free embedding model (about 120 MB). After that it works offline and costs nothing: this week's lessons don't need an API key at all.

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

In [`lib/embeddings.js`](../../lib/embeddings.js):

```js
export function cosineSimilarity(a, b) {
  let dot = 0, lengthA = 0, lengthB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    lengthA += a[i] * a[i];
    lengthB += b[i] * b[i];
  }
  return dot / (Math.sqrt(lengthA) * Math.sqrt(lengthB));
}
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
