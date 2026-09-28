# Day 43: Deployment

An app that only runs on your laptop isn't finished. Today you put it on the internet with a URL anyone can open, and you make sure a stranger can't run up your bill or wreck your data.

## What you will learn

- Deploying a Node.js app to **Render** with a Blueprint (`render.yaml`)
- Setting up **MongoDB Atlas** for production
- Managing **secrets** in production: environment variables, never code
- Fitting AI features into a small server: memory, cold starts, hosted embeddings
- Protecting a public app: admin token, rate limits, spending limits

We deploy [DocuChat Pro](../docuchat-pro). The same steps work for your own project.

## 1. Database: MongoDB Atlas

1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) (or reuse the one from the MERN course).
2. **Database Access** → add a user with a strong password, just for this app.
3. **Network Access** → allow Render to connect. The simplest option is `0.0.0.0/0` (anywhere). That's acceptable **only** with a strong password; paid Render plans give you fixed IP addresses you can allow instead.
4. Copy the connection string and add a database name: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/docuchat`.

## 2. Choose embeddings that fit the server

Render's free plan has **512 MB of memory**. The local embedding model needs about 700 MB on its own, so on the free plan use a hosted embedding provider:

| `EMBEDDING_PROVIDER` | Memory | Cost | Key needed |
|---|---|---|---|
| `local` | ~900 MB total | Free | none (needs a paid 1–2 GB plan) |
| `openai` | ~250 MB total | Very low (a few cents for this whole course's lessons) | `OPENAI_API_KEY` |
| `qwen` | ~250 MB total | Very low | `DASHSCOPE_API_KEY` + `QWEN_BASE_URL` |

(Measured on a laptop with DocuChat Pro and the reranker loaded. Set `RERANK=off` to save another ~100 MB.)

**Ingest with the same provider you deploy with.** Vectors from different models can't be compared. From your laptop, with the production values in `.env`:

```bash
EMBEDDING_PROVIDER=openai npm run day27 -- ./my-documents
```

(If you switch provider later, just run the ingestion again: it re-embeds everything and updates the index size.)

## 3. Deploy to Render

The repo includes [`render.yaml`](../../render.yaml), a **Blueprint** that describes the service:

```yaml
buildCommand: npm ci && npm run warm-models   # install, then download the reranker during the build
startCommand: npm run docuchat
healthCheckPath: /api/health                   # Render checks this to know the app is up
```

1. Push your code to GitHub. Check that `.env` is **not** in the commit (`git status`).
2. In Render: **New → Blueprint**, pick your repository.
3. Render asks for every `sync: false` value: paste your `ANTHROPIC_API_KEY`, `MONGODB_URI`, `EMBEDDING_PROVIDER` and its key. They're stored encrypted, never in your code.
4. `ADMIN_TOKEN` is generated for you. Find it in the service's **Environment** tab: you'll need it to upload documents.
5. Wait for the build, then open the URL. Check `https://your-app.onrender.com/api/health` returns `{"ok":true}`.

## 4. Protect your public app

Anyone on the internet can now reach your app. DocuChat Pro already has:

| Protection | How |
|---|---|
| Only you can change documents | Upload and delete need `ADMIN_TOKEN` (the page asks for it) |
| One visitor can't spam questions | 10 questions per minute per visitor (Day 39) |
| Private data stays out of the model and logs | `redact()` on every question (Day 39) |
| Requests can't hang forever | 60-second timeout, 2 retries |
| Correct visitor addresses behind Render's proxy | `app.set("trust proxy", 1)` |

And one protection that lives outside your code: **set a monthly spending limit** in the Anthropic Console (and OpenAI/Qwen if you use them). It's the guardrail that still works when your code has a bug.

## 5. Things that surprise people

- **Cold starts.** Free Render services sleep after about 15 minutes with no visitors. The next visitor waits ~30–60 seconds while it wakes up. Open your app a minute before your demo.
- **Logs.** `console.log` output is in the Render dashboard's **Logs** tab. The `logs/requests.jsonl` file is lost when the service restarts: in a real app, send logs to a logging service or MongoDB.
- **Conversations are in memory**, so they reset on every restart or deploy. Fine for a demo; save them in MongoDB (Day 13) for a real app.

## Optional: a separate front end on Vercel

If your front end is a React app (Day 14), deploy it to [Vercel](https://vercel.com) and the API to Render:

1. Set the API's URL in the React app from an environment variable (e.g. `VITE_API_URL`), instead of the Vite proxy.
2. In Express, allow requests from your Vercel URL only, with the `cors` package: `cors({ origin: "https://your-app.vercel.app" })`.

## Optional: evals in GitHub Actions

[`eval-workflow.yml`](eval-workflow.yml) is a template that runs `npm run eval -- --quick` on every pull request (Day 40). Copy it to `.github/workflows/eval.yml` and add the secrets it lists to your repository.

## Checklist

- [ ] The public URL works on your phone
- [ ] `/api/health` returns `{"ok":true}`
- [ ] Uploading without the admin token is refused
- [ ] `.env` is not on GitHub; all secrets are in Render's Environment tab
- [ ] A spending limit is set on every AI provider account
- [ ] Your eval questions give the same answers in production as on your laptop
