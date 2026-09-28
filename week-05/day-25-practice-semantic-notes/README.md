# Day 25: 🛠️ Practice Day — Semantic Search for Notes

No new theory today. You add meaning-based search to a Notes API, like the one from the MERN course, using everything from Week 5.

## What you will build

A Notes API where `GET /api/notes/search?q=...` finds notes by **meaning**:

| You search for | It should find |
|---|---|
| `when is my test` | "Networks exam" |
| `what to take on the hike` | "Trek packing list" |
| `library closing time` | "पुस्तकालय" (a note written in Nepali) |
| `job application` | "Internship" |
| `keeping secrets out of git` | "Git reminder" |

None of these searches share a keyword with the note they should find.

## Requirements

1. **CRUD** for notes: `GET /api/notes`, `GET /api/notes/:id`, `POST /api/notes`, `PUT /api/notes/:id`, `DELETE /api/notes/:id`, stored in MongoDB.
2. **Embed on save.** When a note is created, embed its title and content together and store the vector with the note.
3. **Re-embed on update.** If the text changes, the embedding must change too.
4. **Never return embeddings** in API responses. They're 384 numbers nobody needs.
5. **Create the vector index** automatically on first start and wait until it's ready.
6. **`GET /api/notes/search?q=&limit=`** uses `$vectorSearch` and returns notes with a `score`. Cap `limit` at 20.
7. Validation and friendly errors, as in Week 3.

## Setup

Use the same Atlas (or `atlas-local` Docker) connection as Day 24. Start the reference server, then load the 8 sample notes in [`sample-notes.json`](sample-notes.json) (including one in Nepali) from a second terminal:

```bash
npm run day25
npm run day25:samples
curl "localhost:3000/api/notes/search?q=when%20is%20my%20test"
```

When you build your own version, point `npm run day25:samples` at it by setting `NOTES_URL` if it runs on another port.

## Checklist

- [ ] All five searches in the table above return the right note first
- [ ] Editing a note's text changes what it's found by (wait a second or two first: see below)
- [ ] `GET /api/notes` responses don't contain `embedding`
- [ ] A search with no `q` returns 400
- [ ] Deleting a note removes it from search results

## "I saved a note but search can't find it!"

Atlas updates vector indexes **in the background**, usually within a second or two. A search sent immediately after saving can miss the new note, while `GET /api/notes` shows it straight away. This is called **eventual consistency**. Most apps don't need to do anything about it, but your tests must wait briefly, and your UI shouldn't promise instant search results.

## Reference solution

[`solution/server.js`](solution/server.js) is a complete version. It uses the embedding helpers from `lib/` and the database helpers from [Day 24](../day-24-vector-database/db.js). Try it yourself first.

## Stretch goals

1. **Hybrid search preview:** if the query is a single word that appears in a title, show that note first. (Week 7 does this properly.)
2. **"Related notes":** `GET /api/notes/:id/related` returns the 3 notes most similar to this one.
3. **Minimum score:** hide results below a score threshold. How do you choose the threshold? (Test it!)
4. Add a search box to a React front end.
