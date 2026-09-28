# Day 15: 🛠️ Practice Day — Full-Stack Chat App

No new theory today. You combine Days 11–14 into one app, and add a feature that turns a single chatbot into several useful assistants.

## What you will build

A ChatGPT-style app where the user picks an **assistant** when starting a new chat:

| Assistant | What it does |
|---|---|
| Python Tutor | Explains concepts step by step, gives hints before answers |
| English ↔ Nepali Translator | Translates in either direction |
| Code Reviewer | Reviews pasted code for bugs, security and readability |

The system prompts are ready for you in [`personas.py`](personas.py).

## Requirements

Start from a copy of the Day 13 server and the Day 14 React app.

**Backend**

1. Save a `persona` field on each conversation document (default `"tutor"`).
2. Add `GET /api/personas`, returning each persona's `id`, `name` and `description`. **Don't** send the system prompts to the browser.
3. `POST /api/conversations` accepts `{ persona }`. Reject unknown ids with a 400.
4. When replying, use the conversation's persona's `system` prompt instead of the fixed `SYSTEM`.

**Front end**

5. "New chat" shows the three assistants as cards. Clicking one creates the conversation.
6. Show the assistant's name at the top of the chat window, and an icon or label next to each chat in the sidebar.

**Quality**

7. Everything from Days 12–14 still works: streaming, saved history, Stop.
8. Errors are friendly: a wrong API key, the database being down, or a rate limit never shows a blank screen.

## Why the persona id, not the prompt?

If the browser sent the system prompt, anyone could open DevTools and change it to "ignore all rules". Sending only an id and looking up the prompt on the server keeps you in control. It's the same idea as Day 13, where the server owns the history.

## Checklist before you finish

- [ ] Start one chat with each assistant and check that each behaves differently
- [ ] Refresh the page: every chat reopens with the right assistant
- [ ] Try `POST /api/conversations` with `{ "persona": "hacker" }` and get a 400
- [ ] `GET /api/personas` doesn't include any system prompt text
- [ ] Press Stop mid-answer, refresh, and the partial answer is still there

## Stretch goals

1. **Custom assistant:** let users write their own instructions. Store them on the conversation, and limit them to 1,000 characters.
2. **AI titles:** after the first reply, generate a 5-word title with `effort: "low"` (the Day 13 homework).
3. **Cost meter:** save `outputTokens` for every reply and show the total cost of each conversation in the sidebar (Day 2).
