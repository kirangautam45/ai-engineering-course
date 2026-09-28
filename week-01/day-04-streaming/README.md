# Day 04: Streaming Responses

Long answers can take many seconds. Streaming shows the text **as it is written**, like ChatGPT or Claude.ai do, so users aren't staring at a blank screen.

## What you will learn

- Why streaming feels faster even though the total time is the same
- The stream events: `message_start`, `content_block_delta`, `message_stop` and more
- How to print text as it arrives, then read the full message at the end
- "Time to first token" — the number that makes an app feel fast

## Run it

```bash
python run.py day4
python run.py day4 "Explain recursion with a story about Russian dolls"
```

## Walkthrough

1. `with client.messages.stream(...) as stream:` opens a stream. The `with` block makes sure the connection is closed afterwards.
2. `stream.text_stream` gives you each small piece of text as it arrives. We print it with `print(text, end="", flush=True)`: no newline, and shown immediately.
3. `stream.get_final_message()` returns the same object `messages.create()` would, including `usage`.

## Try it

- Compare "first text after" with "finished after". Which one does the user actually feel?
- Log every `event.type` instead of just the text. Which events appear, and in what order?
- Change Day 3's chatbot to stream its answers.

## Homework

Add streaming to your Day 3 quiz master. Bonus: show a `...` spinner until the first piece of text arrives.
