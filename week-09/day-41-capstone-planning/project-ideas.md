# Capstone Project Ideas

Pick one, change it to fit your interests, or bring your own. ⭐ = difficulty.

## Questions over documents (RAG)

| Idea | Difficulty | Notes |
|---|---|---|
| **College notice assistant**: ask about exam rules, fees and deadlines from notice PDFs | ⭐ | Start from DocuChat Pro. Test with Nepali questions |
| **Syllabus helper**: "What should I study for the Unit 3 exam?" from course syllabi | ⭐ | Needs good chunking of tables |
| **Government services guide**: how to get a citizenship certificate, passport or license, from official guides | ⭐⭐ | Public documents only; cite everything; say "check with the office" when unsure |
| **Company handbook bot** for an internship or club | ⭐⭐ | Add per-user permissions if some documents are private |
| **Research paper Q&A** for your final-year project | ⭐⭐ | PDFs with equations and tables are hard; test extraction first |

## Assistants that take actions (tools)

| Idea | Difficulty | Notes |
|---|---|---|
| **Study planner**: turns "exams in 3 weeks, these 5 subjects" into a calendar | ⭐⭐ | Structured output + a calendar export (.ics) |
| **Expense tracker chat**: "I spent 450 on momo" → saved and summarized | ⭐⭐ | Tools that write to MongoDB, with confirmation |
| **Trek/travel assistant** with weather and currency tools (Day 17) | ⭐⭐ | Add a forecast tool and a packing-list generator |
| **Help-desk triage**: classifies and routes tickets from the MERN Helpdesk API | ⭐⭐⭐ | Evals for the classifier are essential |

## Other

| Idea | Difficulty | Notes |
|---|---|---|
| **Code review assistant** for student assignments | ⭐⭐ | Day 15's reviewer persona + structured output for a score |
| **English ↔ Nepali learning buddy** with quizzes and progress | ⭐⭐ | Try `lib/llm.js` to compare providers for Nepali |
| **Voice notes to study notes**: transcribe a lecture recording and summarize it | ⭐⭐⭐ | `transcribe()` in `lib/llm.js` (Qwen Omni or OpenAI), then chunk and summarize |

## Avoid

- Anything that gives **medical, legal or financial advice** as if it were a professional
- Scraping websites that don't allow it, or using other people's private data
- "A better ChatGPT": too broad to finish or demo
