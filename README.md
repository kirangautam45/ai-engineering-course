# AI Engineering — 45-Day Course (LLMs, Prompting & RAG)

**A free, class-paced course that takes you from your first LLM API call to a deployed RAG app: prompt engineering, tool calling, embeddings, vector search and evals, all in Python.**

[![GitHub stars](https://img.shields.io/github/stars/kirangautam45/ai-engineering-course?style=social)](https://github.com/kirangautam45/ai-engineering-course/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude-API-D97757?logo=anthropic&logoColor=white)

> 🐍 **This is the Python version** (branch [`python`](https://github.com/kirangautam45/ai-engineering-course/tree/python)). The JavaScript/Node.js version is on [`main`](https://github.com/kirangautam45/ai-engineering-course).
>
> 🚧 **Conversion in progress:** Weeks 1–7 are in Python. Weeks 8–9 still contain the JavaScript code and are being converted.

> ⭐ **If this course helps you learn or teach AI engineering, please star the repo.** It helps other students find it.

**Jump to:** [Quick start](#quick-start) · [Course structure](#course-structure) · [Full day-by-day plan](TOPICS.md) · [Contributing](#contributing)

## Who this is for

- Developers and students who know Python and want to build AI features
- Anyone who prefers Python to JavaScript: the lessons, projects and pace match the [JavaScript version](https://github.com/kirangautam45/ai-engineering-course)
- Teachers looking for a ready-made, day-by-day AI curriculum

Each day is sized for a **50-minute class** (about 35 minutes of teaching and 15 minutes of live coding or Q&A), with homework covering the rest.

## Prerequisites

- Python basics: functions, lists, dicts, classes, `import`
- Using a terminal, `pip` and virtual environments
- From Week 3: a little HTML, and HTTP basics (requests, JSON, status codes). FastAPI and MongoDB are introduced in the lessons

## Quick start

```bash
git clone https://github.com/kirangautam45/ai-engineering-course.git
cd ai-engineering-course
git checkout python
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e .
cp .env.example .env               # then paste your API key into .env
python run.py day1 "Explain what an API is in one sentence"
```

You need **Python 3.11 or newer** and an API key from the [Anthropic Console](https://console.anthropic.com/). Set a monthly spending limit there before you start. Each Week 1 exercise costs a fraction of a cent.

## What students will have built by Day 45

| Milestone | Day | Description |
|---|---|---|
| `ask` CLI | 5 | A command-line assistant with roles, error handling and stop-reason checks |
| Prompt library | 10 | Versioned prompts with automated test cases |
| Full-stack chat app | 15 | React + FastAPI + MongoDB chat with streaming and saved conversations |
| Support bot | 20 | An agent that calls the Helpdesk API with tools |
| Semantic search | 25 | Meaning-based search over the Notes API |
| **DocuChat (RAG)** | 30 | Upload PDFs and ask questions, with cited answers |
| Eval suite | 40 | Automated quality scores for DocuChat |
| **Final project** | 45 | A deployed AI app of each student's choice |

## Course structure

| Week | Days | Focus |
|---|---|---|
| 1 | 1–5 | LLM foundations: API calls, tokens, chat, streaming |
| 2 | 6–10 | Prompt engineering: structure, examples, thinking, JSON output |
| 3 | 11–15 | AI in web apps: FastAPI, SSE streaming, MongoDB, React |
| 4 | 16–20 | Tool use and agents, prompt-injection safety |
| 5 | 21–25 | Embeddings, chunking and vector search |
| 6 | 26–30 | Retrieval-augmented generation (RAG) with citations |
| 7 | 31–35 | Better RAG: hybrid search, reranking, caching |
| 8 | 36–40 | Evaluation, guardrails and monitoring |
| 9 | 41–45 | Capstone project and deployment |

Full day-by-day breakdown with objectives and homework: **[TOPICS.md](TOPICS.md)**

Every fifth day is a **practice day**: no new theory, students build while the instructor helps.

## Lessons in this repo

| Day | Lesson | Run |
|---|---|---|
| 1 | [Your first LLM API call](week-01/day-01-first-call) | `python run.py day1` |
| 2 | [Tokens and cost](week-01/day-02-tokens-cost) | `python run.py day2` |
| 3 | [System prompts and multi-turn chat](week-01/day-03-roles-chat) | `python run.py day3` |
| 4 | [Streaming responses](week-01/day-04-streaming) | `python run.py day4` |
| 5 | [🛠️ Practice: a reliable `ask` CLI](week-01/day-05-practice-ask-cli) | `python run.py day5` |
| 6 | [Anatomy of a good prompt](week-02/day-06-prompt-anatomy) | `python run.py day6` |
| 7 | [Few-shot examples and XML tags](week-02/day-07-examples-xml) | `python run.py day7` |
| 8 | [Thinking and effort](week-02/day-08-thinking-effort) | `python run.py day8` |
| 9 | [Structured output (JSON)](week-02/day-09-structured-output) | `python run.py day9` |
| 10 | [🛠️ Practice: prompt library with tests](week-02/day-10-practice-prompt-tests) | `python run.py day10` |
| 11 | [A FastAPI chat API](week-03/day-11-fastapi-chat-api) | `python run.py day11` |
| 12 | [Streaming to the browser (SSE)](week-03/day-12-sse-streaming) | `python run.py day12` |
| 13 | [Saving conversations in MongoDB](week-03/day-13-mongodb-conversations) | `python run.py day13` |
| 14 | [A React chat UI](week-03/day-14-react-chat-ui) | `npm run dev` in its folder (React) |
| 15 | [🛠️ Practice: full-stack chat app](week-03/day-15-practice-chat-app) | Project spec |
| 16 | [Your first tool: a calculator](week-04/day-16-first-tool) | `python run.py day16` |
| 17 | [Multiple tools, parallel calls and errors](week-04/day-17-multiple-tools) | `python run.py day17` |
| 18 | [The tool runner](week-04/day-18-tool-runner) | `python run.py day18` |
| 19 | [Prompt injection](week-04/day-19-prompt-injection) | `python run.py day19` |
| 20 | [🛠️ Practice: support bot for the Helpdesk API](week-04/day-20-practice-support-bot) | `python run.py day20` |
| 21 | [What are embeddings?](week-05/day-21-what-are-embeddings) | `python run.py day21` |
| 22 | [Generating and storing embeddings](week-05/day-22-generating-embeddings) | `python run.py day22 build` |
| 23 | [Chunking](week-05/day-23-chunking) | `python run.py day23` |
| 24 | [Vector databases (Atlas Vector Search)](week-05/day-24-vector-database) | `python run.py day24 setup` |
| 25 | [🛠️ Practice: semantic search for notes](week-05/day-25-practice-semantic-notes) | `python run.py day25` |
| 26 | [How RAG works](week-06/day-26-how-rag-works) | `python run.py day26` |
| 27 | [The ingestion pipeline](week-06/day-27-ingestion) | `python run.py day27` |
| 28 | [Retrieval and answering](week-06/day-28-retrieval-answering) | `python run.py day28 "question"` |
| 29 | [Citations](week-06/day-29-citations) | `python run.py day29 "question"` |
| 30 | [🛠️ Practice: DocuChat (capstone 1)](week-06/day-30-practice-docuchat) | `python run.py day30` |
| 31 | [Hybrid search](week-07/day-31-hybrid-search) | `python run.py day31` |
| 32 | [Reranking](week-07/day-32-reranking) | `python run.py day32` |
| 33 | [Query rewriting](week-07/day-33-query-rewriting) | `python run.py day33` |
| 34 | [Prompt caching and cost control](week-07/day-34-prompt-caching) | `python run.py day34` |
| 35 | [🛠️ Practice: DocuChat 2](week-07/day-35-practice-better-docuchat) | `python run.py day35` |
| 36 | [Why evals matter](week-08/day-36-why-evals) | `python run.py day36` |
| 37 | [LLM-as-judge](week-08/day-37-llm-as-judge) | `python run.py day37` |
| 38 | [Measuring RAG](week-08/day-38-measuring-rag) | `python run.py day38` |
| 39 | [Guardrails and monitoring](week-08/day-39-guardrails-monitoring) | `python run.py day39` |
| 40 | [🛠️ Practice: an eval suite](week-08/day-40-practice-eval-suite) | `python run.py eval` |
| 41 | [Capstone planning](week-09/day-41-capstone-planning) | Templates and ideas |
| 42 | [Build day](week-09/day-42-build-day) | `python run.py docuchat` |
| 43 | [Deployment (Render + Atlas)](week-09/day-43-deployment) | [`render.yaml`](render.yaml) |
| 44 | [Polish and demo prep](week-09/day-44-polish-demo-prep) | Templates |
| 45 | [🎓 Demo day](week-09/day-45-demo-day) | Rubric |

All 45 days are complete. The capstone reference app, [DocuChat Pro](week-09/docuchat-pro), combines everything and deploys to Render with one Blueprint.

## Tooling

| Tool | Notes |
|---|---|
| Python | 3.11 or newer (3.12 recommended), in a virtual environment |
| [`anthropic`](https://pypi.org/project/anthropic/) | Official Claude SDK for Python |
| [`run.py`](run.py) | Runs any lesson: `python run.py day7`, or `python run.py list` |
| MongoDB Atlas | Free M0 cluster, used for chat history and Vector Search |
| Local embedding models | Free, no API key (Week 5 onward) |
| Render / Vercel | Deployment (Week 9) |

The lessons use `claude-opus-5` by default. To try a different model, set `MODEL` in your `.env` file.

## Using other providers

The lessons use Claude, but [`lib/llm.js`](lib/llm.js) gives you one simple interface for **OpenAI, DeepSeek, Qwen and local models (Ollama)** too: chat, streaming, images and audio. See [extras/compare-providers](extras/compare-providers) to set them up and compare their answers side by side:

```bash
npm run providers -- "Explain recursion to a 10-year-old"
```

## Scope notes

Deliberately **out of scope** to fit 45 classes:

- Training or fine-tuning your own models
- The maths behind transformers (covered conceptually only)
- Python ML libraries (PyTorch, scikit-learn)
- Agent frameworks like LangChain. Students learn the raw API first, so frameworks are easy to pick up later.

## Contributing

Found a bug in an example, a typo, or have a better exercise idea? Contributions are welcome:

1. Fork the repo and create a branch: `git checkout -b fix/day-03-chat`
2. Make your change and commit it with a clear message
3. Open a pull request describing what you changed and why

## License

Released under the [MIT License](LICENSE). It's free to use, adapt and teach from. Attribution is appreciated.

---

<p align="center">Made with ❤️ by <a href="https://github.com/kirangautam45">Kiran Gautam</a> · <a href="https://kirangtm.com.np/">kirangtm.com.np</a><br>⭐ Star the repo if you found it useful!</p>
