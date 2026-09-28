# Day 02: Tokens and Cost

LLMs don't read characters or words — they read **tokens**. Every limit and every bill is measured in tokens, so today you learn to count them.

## What you will learn

- What a token is (roughly ¾ of an English word; other languages often use more)
- The **context window**: the maximum number of tokens the model can read at once
- Input tokens vs output tokens, and why output tokens cost more
- How to count tokens before sending, and calculate cost after

## Run it

```bash
npm run day2
npm run day2 -- "नमस्ते! यो वाक्यमा कति टोकन छन्?"
```

## Walkthrough

1. `client.messages.countTokens()` tells you the size of a prompt without running the model.
2. `response.usage` reports the real input and output tokens for the call.
3. We multiply by the price per million tokens to get the cost in dollars.

## Try it

- Compare the token count of the same sentence in English and in Nepali. Which uses more tokens?
- Paste a long paragraph. How many characters per token do you get?
- Ask for "a one-word answer" vs "a detailed essay". How much does the cost change?

## Homework

Make a small table in `homework.md`: five different prompts, their input tokens, output tokens and cost. Write two sentences on what makes a prompt expensive.
