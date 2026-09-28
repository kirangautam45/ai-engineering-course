# Day 44: Polish and Demo Prep

Your app works and it's online. Today you make it **feel** finished, prove how good it is with numbers, and prepare a demo that goes smoothly even when something goes wrong.

## 1. Polish the experience

Go through your app as a first-time user would. Fix anything in this list:

- [ ] **Empty state**: the first screen explains what the app does and what to try ("Ask about exam rules, fees or deadlines")
- [ ] **Loading states**: something moves while the model thinks (Day 12's typing indicator)
- [ ] **Error messages**: every failure says what happened and what to do, never a stack trace or a blank screen
- [ ] **"I don't know" is helpful**: it suggests what to ask or who to contact instead
- [ ] **Sources are visible**: users can see where each answer came from
- [ ] **Works on a phone**: open it on your phone, not just in DevTools
- [ ] **Example questions**: 3 clickable examples that you know work well

## 2. Measure it

Run your eval set against the **deployed** app's settings and record:

| Metric | Your number |
|---|---|
| Eval score (answerable) | e.g. 9/10 |
| "I don't know" when it should | e.g. 3/3 |
| Typical answer time | e.g. 3–5 s |
| Cost per question | e.g. $0.006 |

Put these in your README. Numbers turn "it works well" into something people believe.

## 3. Write the README

Use [`project-readme-template.md`](project-readme-template.md). A good project README has:

- One sentence on what it does, and the **live URL** at the top
- A screenshot or GIF
- How it works (a simple diagram is enough)
- Your eval results
- How to run it locally
- What's missing and what you'd do next (honesty is a strength here)

## 4. Prepare the demo

You have **3 minutes**. Write it down with [`demo-script-template.md`](demo-script-template.md) and rehearse it twice, out loud, with a timer.

A demo that works:

1. **The problem** (30 s): who has it, and why it matters
2. **Live demo** (90 s): one great question, one follow-up, and one question it correctly *doesn't* answer
3. **How it works + results** (45 s): the diagram and your eval score
4. **What's next** (15 s)

### Plan for things going wrong

- Open the app **before** your turn (cold starts on free hosting, Day 43)
- Have a **screen recording** of the demo ready in case the internet or the API fails
- Use questions you've tested today, not new ones
- If an answer is wrong during the demo, say so and explain why. Knowing your system's limits is impressive.

## End-of-day check

- [ ] README with live URL, screenshot and eval results
- [ ] Demo script written and rehearsed twice
- [ ] Backup screen recording saved
