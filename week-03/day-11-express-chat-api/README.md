# Day 11: An Express Chat API

Until now, every lesson ran in the terminal. Today you put the model behind **your own backend**, so a website or mobile app can use it.

## What you will learn

- Why the browser must **never** call the LLM API directly (your API key would be visible to everyone)
- Building `POST /api/chat` with Express
- Validating input before you pay for it: message count, length and roles
- Turning API errors into friendly HTTP responses (429, 502)

## Run it

```bash
npm run day11
```

Then test it with Postman, Thunder Client, or the ready-made requests in [`requests.http`](requests.http) (VS Code's REST Client extension can run them). With curl:

```bash
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hello!"}]}'
```

## Walkthrough

1. **The backend is the gatekeeper.** The API key stays in `.env` on the server. The browser only talks to *your* API, which decides what gets through.
2. **`express.json({ limit: "20kb" })`** rejects huge bodies before they reach your code.
3. **`validateMessages()`** in [`validate.js`](validate.js) checks everything the client sent. Never trust the client: someone can call your API with any body they like.
4. **We rebuild each message** with only `role` and `content`, so extra fields from the client never reach the model.
5. **The error handler** turns a Claude rate limit into a 429 and other API failures into a 502, without leaking internal details to users.

## Try it

- Send 25 messages. What status code do you get?
- Send a message with `"role": "system"`. Why do we block that? (Hint: who should control the system prompt?)
- Put a wrong API key in `.env` and call the API. What does the user see, and what do you see in the server log?

## Homework

Add `POST /api/summarize`, which takes `{ text }` (at most 10,000 characters) and returns `{ summary }` in 3 bullet points. Reuse the validation pattern.
