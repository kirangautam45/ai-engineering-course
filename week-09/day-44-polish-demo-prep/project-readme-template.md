# <Project name>

<One sentence: what it does and for whom.>

**Live:** https://your-app.onrender.com · **Demo video:** <link>

![Screenshot](screenshot.png)

## The problem

<2–3 sentences: who has this problem and how they deal with it today.>

## How it works

```
question → search my documents (hybrid + rerank) → Claude answers with citations → streamed to the page
```

- **Data:** <what documents, how many, where from>
- **Model:** Claude (<model>), embeddings: <provider>
- **Built with:** Node.js, Express, MongoDB Atlas Vector Search, <anything else>

## Results

Evaluated on <N> questions (see `eval-set.js`):

| Metric | Result |
|---|---|
| Answerable questions correct | x/y |
| Correctly said "I don't know" | x/y |
| Typical answer time | x s |
| Cost per question | $x |

## Run it locally

```bash
git clone <repo>
cd <repo>
npm install
cp .env.example .env   # add your keys
npm run ingest -- ./documents
npm start
```

## Limitations and next steps

- <What doesn't work yet, honestly>
- <What you'd build next>

## Credits

Built as the capstone for the [AI Engineering 45-Day Course](https://github.com/kirangautam45/ai-engineering-course).
