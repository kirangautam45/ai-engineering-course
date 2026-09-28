# Day 27: The Ingestion Pipeline

RAG is only as good as the documents behind it. Today you build the part that nobody sees but everything depends on: turning a folder of files into searchable chunks, and keeping them up to date.

## What you will learn

- The ingestion steps: **load → clean → chunk → embed → store**
- Reading PDFs page by page, so answers can point to a page number
- **Re-ingesting without duplicates**: skip unchanged files, replace changed ones, remove deleted ones
- Why one broken file shouldn't stop the whole run

## Setup

Same as Day 24: `MONGODB_URI` must point to MongoDB Atlas or the `atlas-local` Docker image.

## Run it

```bash
python run.py day27
python run.py day27
python run.py day27 ./my-documents
```

The first run ingests every lesson in this course. Run it again straight away: every file is **unchanged**, so nothing is re-embedded. Edit one README and run it again: only that file is updated.

To ingest your own files, put `.md`, `.txt` or `.pdf` files in a folder and pass its path.

## The pipeline

| Step | Where | What happens |
|---|---|---|
| **Load** | [`ailib/loaders.py`](../../ailib/loaders.py) | Reads Markdown/text as-is. PDFs are read page by page with `pypdf`. |
| **Clean** | `cleanText()` | Removes null characters and extra spaces and blank lines, which waste tokens |
| **Chunk** | [`ailib/chunking.py`](../../ailib/chunking.py) | 80-word chunks with 20 words of overlap (Day 23's winner), per page |
| **Embed** | [`ailib/embeddings.py`](../../ailib/embeddings.py) | Batches of 32 chunks |
| **Store** | [`ailib/vector_store.py`](../../ailib/vector_store.py) | Saves each chunk with `source`, `page`, `chunkIndex`, `hash` and `embedding` |

## Keeping the index up to date

Documents change. A naive script that inserts everything on every run creates duplicates, so search results repeat and old versions keep appearing.

`upsertDocument()` handles this with a **content hash**, a fingerprint of the file's text:

1. Same hash as last time → **unchanged**, skip it (no embedding cost).
2. Different hash → delete that file's old chunks and insert the new ones (**updated**).
3. File no longer exists → delete its chunks (**removed**).

Removal only happens inside the folders you scanned, so ingesting `./my-documents` never deletes the course lessons.

## PDFs: what can go wrong

- **Scanned PDFs** are images with no text. `loadDocument()` reports "No text found": they need OCR first.
- **Tables and columns** often come out in a strange order. Always look at the extracted text before trusting it.
- **Headers and footers** repeat on every page and add noise. A good cleaning step removes them.

## Try it

- Run the ingestion twice and compare the times.
- Add a PDF (a syllabus or a notice) to a folder and ingest it. Look at its chunks in Atlas: is the text clean?
- Delete a file from your folder and run again. Does it disappear from the database?

## Homework

Add `.docx` support to `ailib/loaders.py` with the `python-docx` package (`Document(io.BytesIO(data)).paragraphs`), and ingest a Word document.
