# Day 03: System Prompts and Multi-Turn Chat

Today you build a chatbot in the terminal that remembers the conversation.

## What you will learn

- The three roles: `system` (the rules), `user` (the person) and `assistant` (the model)
- Why the API is **stateless**: it remembers nothing between calls
- How to fake memory by sending the whole history every time
- Why long chats get more expensive with every message

## Run it

```bash
npm run day3
```

Try: "What is a variable?", then "Show me an example" — the tutor knows what "an example" refers to because the history is sent along.

## Walkthrough

1. `SYSTEM` is sent with every request as the `system` field. It is not part of `messages`.
2. `history` is a plain array. Each turn we push the user's message, send the whole array, then push the assistant's reply.
3. Watch the input token count grow: every new question re-sends everything before it.

## Try it

- Delete the line that pushes the assistant's answer to `history`. What breaks?
- Change the system prompt so the tutor answers only in Nepali, or only in rhymes.
- Ask it about cricket. Does it follow the "steer back" rule?

## Homework

Turn this into a **quiz master**: the system prompt tells the model to ask the user one question at a time about a topic, check the answer and keep score.
