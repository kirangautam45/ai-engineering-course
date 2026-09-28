# Day 41: Capstone Planning

For the last five days you build and ship **your own** AI app. Today you decide what to build, and, just as importantly, what *not* to build. A small project that works and is deployed beats an ambitious one that doesn't.

## What you will do today

1. Pick a problem and a user
2. Write a one-page plan ([`project-plan-template.md`](project-plan-template.md))
3. Write 10 eval questions **before** writing any code ([`eval-set-template.js`](eval-set-template.js))
4. Get your plan approved by the instructor

## Choosing a project

A good capstone:

- **Solves a real problem for a specific person**: "students in my college who can't find exam rules", not "everyone who needs information"
- **Uses what you learned**: RAG, tools, streaming, evals, guardrails. Pick 2–3, not all of them
- **Has data you can actually get**: public documents, your own notes, or data you create. Never private data you don't have permission to use
- **Can be demoed in 3 minutes**: if you can't show it working quickly, it's too big
- **Fits in 3 days of building** (Days 42–44)

See [`project-ideas.md`](project-ideas.md) for 12 ideas, from easy to hard.

## Scoping: cut, then cut again

List every feature you want, then sort them:

| Must have (Day 42) | Should have (Day 44, if time) | Won't have (say so in your README) |
|---|---|---|
| Upload one kind of document, ask questions, cited answers | Chat history | Login |
| Says "I don't know" correctly | Nepali support | Mobile app |
| Deployed at a public URL | Admin page | Payments |

If your "must have" column is longer than 4 items, your project is too big.

## Decide how you'll measure success **now**

Before you write code, write down how you'll know it works:

- **10 eval questions** with their correct answers (at least 3 your documents *don't* answer)
- **One target number**, e.g. "8/10 eval questions correct" or "answers in under 5 seconds"

Writing the questions first stops you from unconsciously testing only the questions your app is good at.

## Start from what you've built

You don't need to start from zero. Good starting points:

| If your project is... | Start from |
|---|---|
| Questions over documents | [DocuChat Pro](../docuchat-pro) (RAG + chat + guardrails, ready to deploy) |
| An assistant that takes actions | Day 20 support bot (tools + confirmation) |
| A chat app with a personality | Day 15 chat app (personas) |
| Something that grades or extracts | Days 9–10 (structured output + prompt tests) |

## Homework

Finish your one-page plan and your 10 eval questions. Bring them to class on Day 42.
