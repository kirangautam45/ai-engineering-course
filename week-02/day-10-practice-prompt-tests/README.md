# Day 10: 🛠️ Practice Day — A Prompt Library with Tests

No new theory today. You treat prompts like code: kept in files, versioned, and **tested** before every change.

## Why this matters

Change one word in a prompt and it might fix one case and break three others. Without tests you only find out when a user complains. With tests you find out in 20 seconds.

## What's in this folder

```
day-10-practice-prompt-tests/
├── index.js              # the test runner
└── prompts/
    ├── classifier.js     # help-desk message → wifi | account | lab | other
    ├── summarizer.js     # notice → one-sentence SMS alert
    └── extractor.js      # message → { name, phone, email } JSON
```

Each prompt file exports the same shape:

| Field | What it is |
|---|---|
| `name`, `version` | So you know which prompt produced which result |
| `system` | The prompt itself |
| `effort` | How hard the model should try (Day 8) |
| `schema` | Optional Zod schema for JSON output (Day 9) |
| `build(input)` | Turns a test input into the user message |
| `tests` | Example inputs with what we expect back |
| `check(output, test)` | Returns `true` for a pass, or a reason for a fail |

## Run it

```bash
npm run day10
npm run day10 -- classifier
```

You get a ✅/❌ line for every test and a final score like `Score: 12/12 passed`.

## Practice tasks

1. **Break it.** Change the classifier prompt back to its v1 wording (see the CHANGELOG at the bottom of the file). How many tests fail?
2. **Add tests.** Write three tricky inputs for each prompt: a message in Nepali, one that fits two categories, one with no useful information.
3. **Fix it.** Improve a prompt until all your new tests pass. Bump its `version` and add a CHANGELOG line.
4. **New prompt.** Add `prompts/translator.js` that turns English notices into simple Nepali, with a check that dates and room numbers survive.
5. **Stretch:** Run each test 3 times and report tests that pass only sometimes. These "flaky" tests show where your prompt is unclear.

## Keep in mind

- Every run costs a little money. Use `npm run day10 -- <name>` to test only the prompt you're changing.
- A passing test suite doesn't prove a prompt is perfect. It proves it hasn't got worse on the cases you thought of. Add a test every time you find a new failure.
