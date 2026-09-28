# Day 14: A React Chat UI

Today you build the front end for the Day 13 API: a sidebar of saved chats, streaming answers rendered as Markdown, and a Stop button.

## What you will learn

- Reading a streamed response in React and updating the last message as text arrives
- Rendering the model's Markdown (headings, lists, code blocks) **safely**
- Auto-scrolling to the newest text
- Cancelling a request with `AbortController`
- Using Vite's proxy so the React app and the API look like one site

## Run it

You need two terminals. First, start the Day 13 API (Python) from the repo root:

```bash
python run.py day13
```

Then start this React app (it's JavaScript, because browsers run JavaScript; you need [Node.js](https://nodejs.org) 22+ for this lesson only):

```bash
cd week-03/day-14-react-chat-ui
npm install
npm run dev
```

Open http://localhost:5173.

## Files

```
src/
├── api.js                    # every call to the server, including the SSE reader
├── App.jsx                   # holds the conversation list and which chat is open
├── components/
│   ├── Sidebar.jsx           # list of chats, new chat and delete buttons
│   └── ChatWindow.jsx        # messages, input box, streaming and Stop
├── index.css
└── main.jsx
```

## Walkthrough

1. **`vite.config.js`** proxies `/api` to `localhost:3000`, where the Python API runs. The browser thinks everything comes from one site, so you don't need CORS. (If port 3000 is already used by another app, start the API with `PORT=3001 python run.py day13` and change the proxy target to match.)
2. **`api.sendMessage()`** is the Day 12 stream reader, moved into a function that calls `onText()` for each chunk.
3. **Streaming into state:** when the user sends a message we add their bubble *and* an empty assistant bubble. Each `onText` replaces the last message with a copy that has the new text appended. Never mutate state directly.
4. **`<Markdown>`** from `react-markdown` renders the model's formatting. It ignores raw HTML by default, which matters: text from a model should be treated like any other untrusted user input.
5. **Stop:** `abortRef.current.abort()` cancels the `fetch`. The server sees the connection close, aborts the model and saves the partial answer (Day 13).
6. **`key={activeId}`** on `ChatWindow` makes React create a fresh component when you switch chats, so old messages never flash into the new chat.

## Try it

- Ask for "a table comparing let, const and var". Does the table render? (Hint: tables need the `remark-gfm` plugin.)
- Press Stop halfway through a long answer, then refresh the page. Is the partial answer saved?
- Open the app on your phone's screen size in DevTools. What's missing?

## Homework

1. Add `remark-gfm` so tables and checklists render.
2. Add a **Copy** button to every code block.
3. Show the sidebar as a slide-out menu on small screens.
