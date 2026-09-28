# Day 30: 🛠️ Practice Day — DocuChat (Capstone 1)

No new theory today. You combine Weeks 3–6 into **DocuChat**: upload your own documents, ask questions, and get streamed answers with citations.

## What you will build

| Feature | From |
|---|---|
| Upload PDFs, Markdown and text files | Day 27 (loaders, ingestion) |
| Re-uploading a file updates it instead of duplicating it | Day 27 (content hash) |
| Semantic retrieval, optionally inside one document | Days 24 and 28 |
| Answers grounded in the documents, with "I don't know" | Day 28 |
| Numbered citations and a sources list | Day 29 |
| Streaming answers over SSE, stopping when the user leaves | Days 12–13 |

## API

| Method | Route | What it does |
|---|---|---|
| `POST` | `/api/documents` | Upload a file (multipart, field `file`, max 10 MB) |
| `GET` | `/api/documents` | List documents with their pages and chunk counts |
| `DELETE` | `/api/documents/:source` | Delete a document and all its chunks |
| `POST` | `/api/ask` | `{ question, source? }` → an SSE stream of `text`, `source`, `cite`, `done` events |

## Requirements

1. **Uploads**: accept only `.pdf`, `.md` and `.txt`, max 10 MB. Use the file's **base name** as its id, never a path sent by the client.
2. **Friendly errors**: a scanned PDF with no text returns 422 with a clear message, not a crash.
3. **Ask**: retrieve 5 chunks (only from `source` if given), send them as citation-enabled documents, and stream the answer.
4. **Citations while streaming**: forward `citations_delta` events. Number each unique cited passage once, and send the markers when the cited text block ends.
5. **Empty library**: asking with no documents uploaded explains what to do.
6. **Safety**: documents are uploaded by users, so the system prompt treats them as data, never instructions (Day 19). The page adds text with `append()`/`textContent`, never `innerHTML`.

## Run the reference solution

Try building it yourself first. Then:

```bash
python run.py day30
```

Open http://localhost:3000, upload a PDF (a syllabus, a notice, or a lesson README from this repo), and ask about it.

Code: [`solution/main.py`](solution/main.py) (FastAPI) and [`solution/public/index.html`](solution/public/index.html). The endpoints are plain `def` functions: PyMongo, the PDF reader and the embedding model are synchronous, and FastAPI runs plain `def` endpoints in a thread pool so they don't block each other.

## Checklist

- [ ] Upload a PDF and a Markdown file; both appear in the list with page and chunk counts
- [ ] Upload the same file again: it says `unchanged`
- [ ] Ask something answered on page 3 of a PDF: the source says "page 3"
- [ ] Ask something that isn't in any document: the answer says so, with no citations
- [ ] Choose one document in the dropdown: answers only cite that document
- [ ] Upload a `.docx`: rejected with a clear message
- [ ] Delete a document: it disappears from answers (after a second or two, Day 25)

## Stretch goals

1. **Chat mode**: keep a conversation history, so "what about the second one?" works. (Day 33 shows how to rewrite such follow-up questions for search.)
2. **React front end**: reuse your Day 14 components.
3. **Highlight**: clicking a citation shows the full chunk with the cited sentence highlighted.
4. **Per-user documents**: add login (MERN course) and store an `owner` on each chunk. Add `owner` as a filter field so users only search their own files.
