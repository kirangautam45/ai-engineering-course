# Day 11: A FastAPI Chat API

Until now, every lesson ran in the terminal. Today you put the model behind **your own backend**, so a website or mobile app can use it.

## What you will learn

- Why the browser must **never** call the LLM API directly (your API key would be visible to everyone)
- Building `POST /api/chat` with **FastAPI**, a modern Python web framework
- Validating input with **Pydantic models** before you pay for it: message count, length and roles
- Turning API errors into friendly HTTP responses (429, 502)

## Run it

```bash
python run.py day11
```

FastAPI builds interactive documentation for you: open **http://localhost:3000/docs**, pick `POST /api/chat`, click **Try it out**, and send a request from the browser.

You can also use Postman, Thunder Client, the ready-made requests in [`requests.http`](requests.http) (VS Code's REST Client extension can run them), or curl:

```bash
curl -X POST localhost:3000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hello!"}]}'
```

## Walkthrough

1. **The backend is the gatekeeper.** The API key stays in `.env` on the server. The browser only talks to *your* API, which decides what gets through.
2. **Pydantic models describe a valid request.** `Message` allows only the roles `"user"` and `"assistant"` and 1–4,000 characters of content; `ChatRequest` allows 1–20 messages, and a validator checks the first and last are from the user. FastAPI checks every request against them before your function runs. Never trust the client: someone can call your API with any body they like.
3. **Friendly validation errors.** FastAPI's default reply to invalid input is `422` with a detailed list. We convert it to `400 {"error": "messages.0.role: Input should be 'user' or 'assistant'"}`, the simple shape our web pages expect.
4. **A size limit middleware** rejects bodies over 20 KB with `413` before they're even read.
5. **`m.model_dump()`** turns each validated message back into a plain dict with only the fields we defined, so extra fields from the client never reach the model.
6. **Exception handlers** turn a Claude rate limit into a `429` and other API failures into a `502`, without leaking internal details to users.
7. **`async def` and `async_client`**: while one request waits for the model, the server keeps handling others.

## Try it

- Send 25 messages. What status code and message do you get?
- Send a message with `"role": "system"`. Why do we block that? (Hint: who should control the system prompt?)
- Put a wrong API key in `.env` and call the API. What does the user see, and what do you see in the server log?
- Look at the schema FastAPI generated on the `/docs` page. Where did it come from?

## Homework

Add `POST /api/summarize`, which takes `{"text": ...}` (at most 10,000 characters) and returns `{"summary": ...}` in 3 bullet points. Use a Pydantic model for validation.
