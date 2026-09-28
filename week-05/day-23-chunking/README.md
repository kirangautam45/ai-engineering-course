# Day 23: Chunking

Yesterday's search missed anything that wasn't near the start of a lesson, because the embedding model only reads about 100 words. Today you split documents into **chunks** and measure which way of splitting works best.

## What you will learn

- Why you can't embed a whole document (or a whole book) as one vector
- **Fixed-size chunks with overlap**: simple and surprisingly strong
- **Structure-aware chunks**: split at headings so each chunk is about one topic
- **Metadata**: every chunk remembers where it came from
- How to **measure** a choice with a small test set instead of guessing

## Run it

```bash
npm run day23
```

It chunks every Week 1–4 lesson README in three ways, embeds the chunks and asks 12 [test questions](test-queries.js) whose answers are buried inside one lesson. For each strategy it reports how often the right lesson was in the top 3.

Results when this lesson was written (yours may differ as the READMEs change):

| Strategy | Chunks | Right lesson in top 3 |
|---|---|---|
| Whole document | 20 | 8 / 12 |
| Fixed size, 80 words, 20 overlap | 125 | **11 / 12** |
| By heading, then size | 150 | 10 / 12 |

## The two strategies

Both live in [`lib/chunking.js`](../../lib/chunking.js) so later lessons can reuse them.

**Fixed size with overlap.** Cut every 80 words. The last 20 words of each chunk are repeated at the start of the next one, so a sentence that's cut in half still appears whole somewhere.

```
words:   [.......... chunk 1 ..........]
                            [.......... chunk 2 ..........]
                                                [.......... chunk 3 ...]
                            ↑ overlap ↑
```

**By heading, then size.** Split the Markdown at `#`, `##` and `###` headings, then cut any long section by size. Each chunk starts with its heading ("Walkthrough: ...") to give it context.

## Why didn't the "smarter" strategy win?

It's reasonable to expect heading-based chunks to be better. Here, many sections are very short (a heading and one line), so those chunks carry little meaning on their own, and some answers are split across a heading and the list under it.

That's the real lesson: **chunking choices depend on your documents, so test them.** Twelve questions took five minutes to write and turned an opinion into a number. You'll build much bigger test sets in Week 8.

## Choosing a chunk size

| Smaller chunks | Larger chunks |
|---|---|
| More precise matches | More context in each result |
| More vectors to store and search | Fewer vectors |
| Can lose context ("it" — what's "it"?) | Must fit the model's limit (128 tokens here) |

Common starting points are 100–500 words for hosted models with long limits. With this local model, stay under ~90 words.

## Try it

- Change `size` to 40 and 120. What happens to the score? Why does 120 get worse with this model?
- Set `overlap` to 0. Does it matter?
- Write three test questions of your own for Week 4 lessons and add them to `test-queries.js`.

## Homework

Chunk one long PDF (a college syllabus or a government notice) both ways, and write 5 test questions for it. Which strategy wins for *your* document? Hint: `npm install pdf-parse` can extract the text.
