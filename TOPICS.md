# Day-by-Day Topics

45 classes × 50 minutes. Each day lists the learning objective, what to cover and the homework.

**Legend:** 🛠️ = practice day (no new theory) · ✅ = example code is in this repo

---

## Week 1 — LLM Foundations (Days 1–5)

### Day 1 — Your first LLM API call ✅
**Objective:** Send a prompt to an LLM from Node.js and read the response.
**Teach:**
- What an LLM is: a model trained to predict the next token. Show a chat app, then show that the same thing is "just" an HTTP request.
- API keys: create one in the Anthropic Console, put it in `.env`, add `.env` to `.gitignore`. Explain what happens when a key leaks on GitHub.
- Walk through `messages.create()`: `model`, `max_tokens`, `messages`. Log the raw response so students see `content`, `stop_reason` and `usage`.
- Ask the same question twice to show that answers vary. Ask about yesterday's news to show the training cutoff.
**Homework:** A CLI that takes a topic and prints three quiz questions about it, plus token usage.
**Code:** [week-01/day-01-first-call](week-01/day-01-first-call)

### Day 2 — Tokens, context windows and cost ✅
**Objective:** Count tokens, explain the context window, and calculate what a request costs.
**Teach:**
- Tokens are pieces of words. Count the same sentence in English and in Nepali and compare.
- The context window is the model's working memory. Everything (system prompt, history, documents, answer) has to fit.
- Input vs output pricing, and why output costs more. Use `countTokens()` before sending and `usage` after.
- Choosing a model: bigger models are smarter but cost more. Show the pricing page.
**Homework:** A table of five prompts with their tokens and cost, plus two sentences on what makes a prompt expensive.
**Code:** [week-01/day-02-tokens-cost](week-01/day-02-tokens-cost)

### Day 3 — System prompts and multi-turn chat ✅
**Objective:** Build a terminal chatbot that keeps conversation history.
**Teach:**
- The three roles: `system`, `user`, `assistant`.
- The API is stateless. Live-demo a chatbot with no history ("What did I just ask?") and then fix it.
- Keep a `history` array and send it every turn. Watch input tokens grow and link back to Day 2's cost lesson.
- Write a system prompt that sets a persona, rules and an answer length.
**Homework:** A quiz-master bot that asks one question at a time and keeps score.
**Code:** [week-01/day-03-roles-chat](week-01/day-03-roles-chat)

### Day 4 — Streaming responses ✅
**Objective:** Stream model output to the terminal as it is generated.
**Teach:**
- Why streaming matters for UX: time to first token vs total time.
- `messages.stream()` and `for await`. Log every event type once so students see the full event sequence.
- Use `finalMessage()` to get the complete response and usage after the stream ends.
- Preview: in Week 3 we send these same chunks to a browser.
**Homework:** Add streaming to the Day 3 quiz master.
**Code:** [week-01/day-04-streaming](week-01/day-04-streaming)

### Day 5 — 🛠️ Practice: a reliable `ask` CLI ✅
**Objective:** Combine Week 1 into a tool that handles errors and edge cases.
**Build:** An `ask` command with a `--role` flag, `stop_reason` checks, typed error handling and refusal fallbacks. Students break it on purpose: a wrong key, no internet, a tiny `max_tokens`.
**Code:** [week-01/day-05-practice-ask-cli](week-01/day-05-practice-ask-cli)

---

## Week 2 — Prompt Engineering (Days 6–10)

### Day 6 — Anatomy of a good prompt ✅
**Objective:** Rewrite a vague prompt into a clear, specific one and measure the difference.
**Teach:**
- The "new employee" test: would a smart person with no context understand what you want?
- The parts of a strong prompt: role, task, context, constraints, output format.
- Explain *why* a rule exists, not only what the rule is. Models follow reasons better than bare commands.
- Live exercise: improve "summarize this" in three rounds and compare outputs side by side.
**Homework:** Take three prompts you use in daily life and rewrite each one using the anatomy.
**Code:** [week-02/day-06-prompt-anatomy](week-02/day-06-prompt-anatomy)

### Day 7 — Examples and structure (few-shot, XML tags) ✅
**Objective:** Use examples and tags to get consistent output.
**Teach:**
- Zero-shot vs few-shot: show one to three examples of the output you want.
- Use XML-style tags (`<document>`, `<instructions>`, `<example>`) to separate the parts of a long prompt.
- Put long documents first and the question last.
- Pitfall: models copy examples too closely. Vary your examples.
**Homework:** A few-shot prompt that turns messy customer emails into a clean ticket summary.
**Code:** [week-02/day-07-examples-xml](week-02/day-07-examples-xml)

### Day 8 — Thinking and effort ✅
**Objective:** Control how much the model reasons before answering.
**Teach:**
- Chain-of-thought: why "think step by step" helped older models.
- Modern models think on their own (adaptive thinking). Show `thinking: { type: "adaptive", display: "summarized" }` and print the summary.
- `output_config.effort` (`low` → `max`) trades cost and speed against quality. Compare `low` vs `high` on a logic puzzle.
- When to use low effort (classification, chat) vs high effort (hard reasoning, code).
**Homework:** Run five puzzles at `low` and `high` effort and record accuracy, tokens and time.
**Code:** [week-02/day-08-thinking-effort](week-02/day-08-thinking-effort)

### Day 9 — Structured output (JSON) ✅
**Objective:** Get reliable JSON that your code can use.
**Teach:**
- Why "reply in JSON" is not enough: stray text, missing fields.
- Use `output_config.format` with a JSON schema so the output always matches.
- Validate with Zod anyway, and handle failures gracefully.
- Use case: extract name, email, issue and priority from a support email.
**Homework:** An extractor that turns a job posting into `{ title, company, skills[], salary }`.
**Code:** [week-02/day-09-structured-output](week-02/day-09-structured-output)

### Day 10 — 🛠️ Practice: prompt library with tests ✅
**Objective:** Treat prompts like code: versioned, reviewed and tested.
**Build:** A `prompts/` folder with three prompts (summarizer, extractor, classifier), each with five test inputs and expected results, plus a script that runs them all and prints a pass/fail table.
**Code:** [week-02/day-10-practice-prompt-tests](week-02/day-10-practice-prompt-tests)

---

## Week 3 — AI in Your Web Apps (Days 11–15)

### Day 11 — An Express chat API ✅
**Objective:** Expose an LLM through your own backend.
**Teach:**
- Never call the LLM API from the browser: your key would be public. The backend is the gatekeeper.
- `POST /api/chat` receives `{ messages }` and returns the reply. Reuse `lib/ask.js`.
- Validate input size so nobody sends you a 1-million-token request.
**Homework:** Add a `POST /api/summarize` endpoint.
**Code:** [week-03/day-11-express-chat-api](week-03/day-11-express-chat-api)

### Day 12 — Streaming to the browser (SSE) ✅
**Objective:** Stream tokens from Express to a web page.
**Teach:**
- Server-Sent Events: `Content-Type: text/event-stream` and `res.write()`.
- Forward each `text_delta` from the SDK stream to the client.
- Handle client disconnects by aborting the stream so you stop paying for tokens nobody reads.
**Homework:** Show a typing indicator until the first token arrives.
**Code:** [week-03/day-12-sse-streaming](week-03/day-12-sse-streaming)

### Day 13 — Saving conversations in MongoDB ✅
**Objective:** Persist chat history per user.
**Teach:**
- A `Conversation` model with a `messages` array.
- Load history, append the new message, call the model, then save the reply.
- Trimming history: keep the last N messages, or summarize old ones to control cost.
**Homework:** Add `GET /api/conversations` to list past chats with auto-generated titles.
**Code:** [week-03/day-13-mongodb-conversations](week-03/day-13-mongodb-conversations)

### Day 14 — A React chat UI ✅
**Objective:** Build a chat interface that renders streamed Markdown.
**Teach:**
- A message list, an input box and auto-scroll.
- Read the SSE stream with `fetch` and a `ReadableStream` reader.
- Render Markdown and code blocks safely.
**Homework:** Add a "Stop generating" button.
**Code:** [week-03/day-14-react-chat-ui](week-03/day-14-react-chat-ui)

### Day 15 — 🛠️ Practice: full-stack chat app ✅
**Objective:** Ship a working ChatGPT-style app.
**Build:** React + Express + MongoDB chat with streaming, saved conversations and a system-prompt picker (tutor, translator, code reviewer).
**Code:** [week-03/day-15-practice-chat-app](week-03/day-15-practice-chat-app)

---

## Week 4 — Tool Use and Agents (Days 16–20)

### Day 16 — What is tool calling?
**Objective:** Let the model call a JavaScript function.
**Teach:**
- The model can't browse, calculate or read your database on its own. Tools give it hands.
- Define a tool with a name, description and JSON schema. When `stop_reason` is `"tool_use"`, run the function and send back a `tool_result`.
- Write the loop by hand once so students see exactly what happens.
**Homework:** A calculator tool, then ask "What is 18% VAT on NPR 45,999?"

### Day 17 — Multiple tools and errors
**Objective:** Handle several tools, parallel calls and failures.
**Teach:**
- The model may call several tools in one turn. Run them all and return every result in one message.
- Return errors as `tool_result` with `is_error: true` so the model can recover.
- Write good tool descriptions: they are prompts too.
**Homework:** Add `get_weather` (real API) and `convert_currency` tools.

### Day 18 — The tool runner
**Objective:** Use the SDK's tool runner instead of a hand-written loop.
**Teach:**
- `betaZodTool` + `client.beta.messages.toolRunner()`: define the tools and the SDK runs the loop.
- Limit the number of iterations so a confused model can't loop forever.
- When to build an "agent" and when a single call is enough.
**Homework:** Rewrite Day 17 with the tool runner.

### Day 19 — Safety: prompt injection and permissions
**Objective:** Recognize and defend against prompt injection.
**Teach:**
- Live demo: a document containing "ignore your instructions and…".
- Treat tool results and documents as data, not instructions.
- Least privilege: read-only tools by default and human confirmation for anything destructive.
**Homework:** Try to break a classmate's Day 17 bot. Write up what worked and how to fix it.

### Day 20 — 🛠️ Practice: support bot
**Objective:** Connect an AI assistant to a real API.
**Build:** A support bot with tools that call the Helpdesk API from the MERN course: `list_tickets`, `get_ticket`, `create_ticket`. Creating a ticket requires the user to confirm.

---

## Week 5 — Embeddings and Vector Search (Days 21–25)

### Day 21 — What are embeddings?
**Objective:** Explain embeddings and compute similarity by hand.
**Teach:**
- An embedding is a list of numbers that captures meaning, so similar text gets nearby vectors.
- Cosine similarity in 10 lines of JavaScript.
- Keyword search vs semantic search: "car" should find "vehicle".
**Homework:** Embed 20 sentences and print the closest pair.

### Day 22 — Generating embeddings
**Objective:** Create embeddings with an embeddings API.
**Teach:**
- Claude doesn't make embeddings. Use a dedicated model: Voyage AI (recommended by Anthropic) or a free local model with Transformers.js.
- Document vs query embeddings, dimensions, batching and cost.
**Homework:** Embed every lesson README in this repo and save the vectors to JSON.

### Day 23 — Chunking
**Objective:** Split documents into chunks that retrieve well.
**Teach:**
- Why you can't embed a whole book: chunks must be small and focused.
- Fixed-size chunks with overlap vs splitting by heading or paragraph.
- Keep metadata (source, page, heading) with every chunk.
**Homework:** Chunk one long PDF in two different ways and compare the results.

### Day 24 — Vector databases
**Objective:** Store and search vectors in MongoDB Atlas Vector Search.
**Teach:**
- Why not loop over every vector: speed and approximate nearest-neighbour search.
- Create a vector index in Atlas and query it with `$vectorSearch`.
- Filter by metadata (for example, only chunks from "week-02").
**Homework:** Move your Day 22 vectors into Atlas and query them.

### Day 25 — 🛠️ Practice: semantic notes search
**Objective:** Build search that understands meaning.
**Build:** Add semantic search to the Notes API from the MERN course: embed notes when they are saved, then `GET /api/notes/search?q=` returns the closest matches.

---

## Week 6 — Retrieval-Augmented Generation (Days 26–30)

### Day 26 — How RAG works
**Objective:** Explain RAG and when to use it.
**Teach:**
- The problem: models don't know your private or recent data.
- RAG = retrieve relevant chunks, put them in the prompt, then generate.
- RAG vs long context vs fine-tuning: when to use each.
**Homework:** Draw the RAG pipeline for a college FAQ bot.

### Day 27 — The ingestion pipeline
**Objective:** Turn raw files into searchable chunks.
**Teach:**
- Load PDF, Markdown and web pages, clean the text, chunk, embed and store.
- Re-ingesting changed files without creating duplicates.
**Homework:** An `ingest.js` script that processes a whole folder.

### Day 28 — Retrieval and answering
**Objective:** Answer questions using only retrieved context.
**Teach:**
- Put the chunks in `<document>` tags, then the question.
- Tell the model to say "I don't know" when the answer isn't in the context, and test that it does.
- How many chunks to include (top-k), and the cost of adding more.
**Homework:** Ask ten questions: five with answers in your docs and five without. How many "I don't know"s are correct?

### Day 29 — Citations
**Objective:** Show users where each answer came from.
**Teach:**
- Pass chunks as `document` blocks with `citations: { enabled: true }`.
- Render the cited text and source under each answer.
- Why citations build trust and make wrong answers easy to spot.
**Homework:** Make citations clickable, so they open the source document.

### Day 30 — 🛠️ Practice: DocuChat backend (capstone 1)
**Objective:** A complete RAG API.
**Build:** DocuChat: upload PDFs, ingest them, and ask questions with cited answers through `POST /api/ask`.

---

## Week 7 — Better RAG (Days 31–35)

### Day 31 — Hybrid search
**Objective:** Combine keyword and vector search.
**Teach:**
- Vector search misses exact terms like codes, names and error messages. Keyword search catches them.
- Merge the two result lists with reciprocal rank fusion.
**Homework:** Find three questions where hybrid beats vector-only search.

### Day 32 — Reranking
**Objective:** Improve the order of retrieved chunks.
**Teach:**
- Retrieve 20 chunks, rerank them, keep the top 5.
- Use a reranker model, or ask the LLM to score relevance.
**Homework:** Measure answer quality before and after reranking.

### Day 33 — Query rewriting
**Objective:** Fix bad user questions before searching.
**Teach:**
- Follow-up questions like "what about the second one?" need the chat history to be searchable.
- Rewrite the query, or generate several queries and merge the results.
**Homework:** Add query rewriting to DocuChat's chat mode.

### Day 34 — Prompt caching and cost control
**Objective:** Cut the cost of repeated large prompts.
**Teach:**
- Prompt caching: a stable prefix (system prompt plus documents) is billed at a fraction of the price on repeat calls.
- Put stable content first and changing content last. Verify with `usage.cache_read_input_tokens`.
- Track the cost of every request in your database.
**Homework:** Show a cost-per-conversation dashboard.

### Day 35 — 🛠️ Practice: upgrade DocuChat
**Objective:** Apply Week 7 to the capstone.
**Build:** Add hybrid search, reranking and caching to DocuChat, and compare before and after on the same 20 questions.

---

## Week 8 — Evaluation and Production (Days 36–40)

### Day 36 — Why evals matter
**Objective:** Build a test set for an AI feature.
**Teach:**
- "It looked fine when I tried it" isn't testing. Every prompt change can break something.
- Build a golden dataset: real questions, expected answers and edge cases.
**Homework:** Write 30 test questions for DocuChat.

### Day 37 — LLM-as-judge
**Objective:** Grade open-ended answers automatically.
**Teach:**
- Use exact-match checks where possible and a model with a clear rubric where not.
- Check your judge against human grades before trusting it.
**Homework:** A judge that scores answers for correctness and whether they are grounded in the sources.

### Day 38 — Measuring RAG
**Objective:** Measure retrieval and generation separately.
**Teach:**
- Retrieval: was the right chunk in the top-k?
- Generation: is the answer faithful to the chunks? Does it cite them?
- Find the weak step before trying to fix it.
**Homework:** Report both metrics for DocuChat.

### Day 39 — Guardrails and monitoring
**Objective:** Make an AI feature safe to run in public.
**Teach:**
- Rate limiting per user, input length limits and output checks.
- Log prompts, responses, tokens and latency, but not secrets or personal data.
- Handle refusals, timeouts and API outages gracefully.
**Homework:** Add rate limiting and structured logging to DocuChat.

### Day 40 — 🛠️ Practice: eval suite
**Objective:** Automate quality checks.
**Build:** `npm run eval` runs the 30 test questions, grades them and prints a score. Run it before and after every prompt change.

---

## Week 9 — Capstone and Deployment (Days 41–45)

### Day 41 — Capstone planning
**Objective:** Scope a realistic AI project.
**Teach:** Pick a problem, the users, the data and the success metric. Examples: a college FAQ bot, a legal-document Q&A tool, a code-review assistant or a Nepali-language study helper.
**Homework:** A one-page project plan with an eval set of 10 questions.

### Day 42 — Build day
**Objective:** Get the core RAG or agent flow working.
**Build:** Ingestion, retrieval and answering, end to end.

### Day 43 — Deployment
**Objective:** Deploy the full stack.
**Teach:**
- Backend on Render or Railway, frontend on Vercel, MongoDB Atlas.
- Environment variables and secrets in production. Set a spending limit on your API key.
**Homework:** A live URL that works on your phone.

### Day 44 — Polish and demo prep
**Objective:** Make it presentable.
**Build:** Loading states, error messages, a README with screenshots and eval scores, and a 3-minute demo script.

### Day 45 — 🎓 Demo day
**Objective:** Present your deployed project.
**Format:** Each student demos their app, shows the eval results and explains one thing they would improve next.
