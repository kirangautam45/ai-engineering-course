# Day 40: 🛠️ Practice Day — An Eval Suite

No new theory today. You combine Days 36–39 into **one command** that tells you whether a change made your AI app better or worse, and that could fail a build before a bad change ships.

## What you will build

```bash
npm run eval
```

```
Eval: 30 questions · retrieval hybrid+rerank · code + judge + groundedness
✅ weather-api
❌ history-limit
…
Score: 26/30 (87%) · answerable 19/22 · unanswerable 7/8
Answers cost $0.16 · took 48s
Previous run with these settings: 83% (2026-09-28T06-42-47-787Z.json)
  🔻 REGRESSION rrf: judge: incorrect (…)
  🔺 now passing: best-chunking
Report saved: week-08/day-40-practice-eval-suite/reports/2026-09-28T07-10-02-114Z.json

❌ FAILED: 1 regression(s)
```

(Example numbers: your score depends on the model.)

## Requirements

1. **Run** every question in the eval set through the real pipeline ([`lib/rag.js`](../../lib/rag.js)).
2. **Grade** each answer with the code checks (Day 36), and unless `--quick`, the LLM judge (Day 37) and groundedness (Day 38).
3. **Save a report** to `reports/` with the date, settings, score, cost and every answer.
4. **Compare** with the previous report **that used the same settings**, and list:
   - **regressions**: passed last time, fails now
   - **fixes**: failed last time, passes now
5. **Exit with code 1** if the score is below `--threshold` (default 80%) or anything regressed, so CI can block the change.
6. **Options**: `--quick` (code checks only), `--retrieval vector|hybrid|hybrid+rerank`, `--threshold 0.85`.

## Why compare only with the same settings?

A run with `--quick` skips the judge, so it passes more easily. Comparing it with a full run would report fake "fixes". Only like-for-like runs tell you whether *your change* helped.

## Reference solution

[`solution/eval.js`](solution/eval.js). Try building it yourself first.

## Using it

- **Before and after every change** to prompts, models, chunking or retrieval. Run it once, make the change, run it again.
- **Read the regressions.** A regression might be the eval's fault (a bad check or question), not the app's.
- **Watch the cost.** A full run makes 30 answer calls, plus 60 judge calls. Use `--quick` while you iterate, and the full suite before you finish.

## Checklist

- [ ] `npm run eval -- --quick` runs and saves a report
- [ ] Running it twice without changes reports no regressions
- [ ] `npm run eval -- --retrieval vector` compares only with earlier `vector` runs
- [ ] A score below the threshold exits with code 1 (`echo $?` after the run)
- [ ] You can explain every failing question in the latest report

## Stretch goals

1. **GitHub Actions**: run `npm run eval -- --quick` on every pull request. You'll need an API key as a repository secret, and an Atlas database the workflow can reach.
2. **Trend chart**: read every report in `reports/` and draw the score over time (an HTML page with a chart library, or Day 14's React app).
3. **Flakiness**: run each question 3 times and flag any whose result changes. Those questions or checks need attention.
