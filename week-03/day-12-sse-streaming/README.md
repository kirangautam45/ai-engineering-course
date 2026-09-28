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
python run.py day12
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

**Server ([`main.py`](main.py))**

1. `StreamingResponse(events(), media_type="text/event-stream")` sends whatever the `events()` generator yields, as it yields it. The media type tells the browser more data is coming.
2. `events()` is an **async generator**: for each piece of `stream.text_stream`, it `yield`s one `data: ...` line followed by a blank line.
3. When the browser disconnects, FastAPI stops the generator. Leaving the `async with client.messages.stream(...)` block closes the connection to Claude, so the model stops too. The `finally:` block runs either way.
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
