# Day 13: Saving Conversations in MongoDB

On Day 12 the history lived in the browser, so refreshing the page wiped it. Today the **server** owns the history and saves every conversation in MongoDB.

## What you will learn

- A `Conversation` model with an embedded `messages` array
- Why the client should send only the **new** message, not the whole history
- Saving the user's message **before** calling the model, and the reply after
- **Trimming history**: only the last 20 messages go to the model, to control cost

## Setup

Add your MongoDB connection string to `.env` (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works, as in the MERN course):

```
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/ai-course
```

## Run it

```bash
npm run day13
```

Use [`requests.http`](requests.http) or Postman to create a conversation, send two messages and fetch the saved result.

## API

| Method | Route | What it does |
|---|---|---|
| `GET` | `/api/conversations` | List conversations (title and date only) |
| `POST` | `/api/conversations` | Start a new conversation |
| `GET` | `/api/conversations/:id` | One conversation with all its messages |
| `DELETE` | `/api/conversations/:id` | Delete a conversation |
| `POST` | `/api/conversations/:id/messages` | Send `{ content }`, get the reply as an SSE stream |

## Walkthrough

1. **The server owns the history.** On Day 12, a user could edit the history in the browser and put words in the assistant's mouth. Now the client sends only `{ content }` and the server loads the real history from the database.
2. **Save first, then call the model.** If the API call fails, the user's message is still saved.
3. **`HISTORY_LIMIT`** keeps requests small. We also drop messages from the front until the history starts with a `user` message, because the API requires that.
4. **Partial replies are saved.** If the user presses Stop, the half-finished answer is kept so the conversation still makes sense.
5. **`app.param("id")`** returns a 404 for malformed ids before they reach MongoDB.

## Try it

- Send 25 messages in one conversation. How many does the model see? (Log `history.length`.)
- Ask the model about something from message 1 after 25 messages. Does it remember? Why not?
- Look at your conversations in MongoDB Atlas → Browse Collections.

## Homework

Replace the "first 50 characters" title with a real one: after the first reply, ask the model (with `effort: "low"`) for a title of at most 5 words and save it.
