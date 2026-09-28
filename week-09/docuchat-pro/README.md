# DocuChat Pro

The course's capstone reference app: everything from Weeks 3–8 in one deployable server.

| Feature | From |
|---|---|
| Upload PDFs, Markdown and text; re-uploads update instead of duplicating | Days 27, 30 |
| Hybrid search + reranking | Days 31, 32 |
| Chat mode with follow-up question rewriting | Days 13, 33 |
| Streamed answers with numbered citations | Days 12, 29, 30 |
| Prompt caching of the conversation | Day 34 |
| Rate limits, redaction of private data, timeouts, JSON request logs | Day 39 |
| Admin token for uploads and deletes, health check, graceful shutdown | Day 43 |
| Local or hosted embeddings (`EMBEDDING_PROVIDER`) | Day 43 |

## Run it locally

```bash
python run.py docuchat
```

Open http://localhost:3000. With no `ADMIN_TOKEN` in `.env`, anyone can upload (fine on your laptop).

## Settings (`.env`)

| Variable | Needed | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Answers questions |
| `MONGODB_URI` | Yes | Atlas (or `atlas-local` Docker) connection string |
| `ADMIN_TOKEN` | In production | Required to upload or delete documents |
| `EMBEDDING_PROVIDER` | No | `local` (default), `openai` or `qwen` |
| `RERANK` | No | `off` to skip reranking on very small servers |
| `PORT` | No | Set automatically by hosting platforms |

## Deploy it

Follow [Day 43](../day-43-deployment/README.md). The repo's [`render.yaml`](../../render.yaml) deploys this app to Render.

## API

| Method | Route | Notes |
|---|---|---|
| `GET` | `/api/health` | `{"ok": true}` when the database is reachable |
| `GET` | `/api/documents` | List documents |
| `POST` | `/api/documents` | Upload (`file` field). Admin only when `ADMIN_TOKEN` is set |
| `DELETE` | `/api/documents/:source` | Admin only when `ADMIN_TOKEN` is set |
| `POST` | `/api/ask` | `{ question, source?, conversationId? }` → SSE stream (see Day 35) |
