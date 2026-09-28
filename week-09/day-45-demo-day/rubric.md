# Capstone Rubric

Each area is scored 1–4. Weighted total out of 100.

| Area (weight) | 4: Excellent | 3: Good | 2: Developing | 1: Beginning |
|---|---|---|---|---|
| **Works and is deployed (30%)** | Live URL works on a phone; core flow is smooth; handles errors gracefully | Live and works; minor rough edges | Works locally only, or deployed but unreliable | Core flow doesn't work |
| **Quality, measured (25%)** | 10+ eval questions including unanswerable ones; score reported; failures understood and explained | Eval set exists and was run; score reported | A few manual tests, no eval set | No testing |
| **Safety and responsible use (15%)** | Keys in env vars; rate limit; redaction or no personal data; admin-only changes; spending limit set; says "I don't know" correctly | Keys safe; most guardrails in place | Keys safe but no other guardrails | Keys in code or on GitHub |
| **Code and README (15%)** | Clear structure; README with live URL, screenshot, results, setup and limitations | Readable code; README covers setup and purpose | Code works but is hard to follow; minimal README | No README |
| **Demo (15%)** | Clear problem; smooth live demo including an honest "I don't know"; results shown; on time | Clear and on time; small hiccups handled | Runs over time or unclear problem | Demo doesn't run and no backup |

**Automatic minimum requirement:** no API keys or passwords in the repository. A committed secret must be removed **and rotated** before the project can be assessed.
