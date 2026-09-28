# Day 12: Streaming to the Browser (SSE)

On Day 4 you streamed text to the terminal. Today you stream it all the way to a web page, word by word, like ChatGPT.

## What you will learn

- **Server-Sent Events (SSE)**: a simple way for a server to push many messages over one HTTP response
- Forwarding the SDK's stream events to the browser as they arrive
- Reading a streamed `fetch` response in the browser
- **Stopping the model when the user leaves**, so you don't pay for tokens nobody reads
- Sending errors *inside* the stream, because the 200 status has already been sent

## Run it

```bash
npm run day12
```

Open http://localhost:3000 and ask for something long, like "Explain how the internet works in 10 steps."

## How the stream looks

Open DevTools → Network, click the `stream` request and look at the response. It's plain text:

```
data: {"type":"text","text":"The internet"}

data: {"type":"text","text":" is a network of"}

data: {"type":"done","stopReason":"end_turn","usage":{...}}
```

## Walkthrough

**Server ([`server.js`](server.js))**

1. `Content-Type: text/event-stream` tells the browser more data is coming on this response.
2. For each `text_delta` from the SDK, we `res.write()` one `data: ...` line followed by a blank line.
3. `res.on("close")` fires when the browser disconnects. If we haven't finished, `stream.abort()` stops the model.
4. Errors after the stream has started can't change the status code, so we send `{ type: "error" }` as an event.

**Browser ([`public/index.html`](public/index.html))**

1. We use `fetch` instead of `EventSource`, because `EventSource` can only make GET requests and we need to POST the history.
2. `res.body.pipeThrough(new TextDecoderStream()).getReader()` gives us the text as it arrives.
3. Chunks don't always line up with events, so we keep a `buffer` and only parse complete events (ending in a blank line).

## Try it

- Ask for a long answer, then close the tab mid-answer. Check the server log for "aborting the stream".
- Throttle the network in DevTools (Slow 3G). Does streaming still feel responsive?
- Compare "First text after" with how long the full answer takes.

## Homework

Show a typing indicator (three animated dots) until the first piece of text arrives, and a **Stop** button that cancels the request using an `AbortController`.
