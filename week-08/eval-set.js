// The Week 8 evaluation set: 30 questions about this course's Week 1–7 lessons.
//
//   answerable:   the lessons contain the answer. `sources` = lesson(s) that answer it,
//                 `mustMention` = facts a correct answer must contain (an array inside means "any of these")
//   unanswerable: the lessons DON'T contain the answer. The right response is "I don't know".
//   reference:    a correct answer written by a human, used by the LLM judge (Day 37)
export const evalSet = [
  { id: "weather-api", type: "answerable", question: "Which free weather API does the course use?", sources: ["day-17"], mustMention: ["Open-Meteo"], reference: "Open-Meteo, which needs no API key." },
  { id: "currency-api", type: "answerable", question: "Which API provides the exchange rates for currency conversion?", sources: ["day-17"], mustMention: [["ExchangeRate-API", "open.er-api", "exchangerate"]], reference: "ExchangeRate-API's free endpoint (open.er-api.com), which needs no key." },
  { id: "browser-key", type: "answerable", question: "Why should the browser never call the LLM API directly?", sources: ["day-11", "day-01"], mustMention: ["key"], reference: "Because the API key would be visible to anyone using the site; the backend keeps the key secret and acts as a gatekeeper." },
  { id: "max-iterations", type: "answerable", question: "What does max_iterations do in the tool runner?", sources: ["day-18"], mustMention: [["limit", "stop", "cap"]], reference: "It's a safety limit on how many model calls the runner makes, so a confused model can't loop forever or spend all your credit." },
  { id: "injection-defences", type: "answerable", question: "What are the two defences in the prompt injection lesson?", sources: ["day-19"], mustMention: ["system prompt", ["confirm", "confirmation"]], reference: "A system prompt saying tool results are data, not instructions; and human confirmation in code before send_email runs." },
  { id: "best-chunking", type: "answerable", question: "Which chunking strategy scored best in the Day 23 comparison?", sources: ["day-23"], mustMention: [["fixed", "80"]], reference: "Fixed-size chunks of 80 words with 20 words of overlap (11 of 12)." },
  { id: "dimensions", type: "answerable", question: "How many numbers are in each embedding vector the course's model produces?", sources: ["day-21", "day-22", "day-24"], mustMention: ["384"], reference: "384." },
  { id: "num-candidates", type: "answerable", question: "What does numCandidates control in $vectorSearch?", sources: ["day-24"], mustMention: [["candidates", "nearby", "consider"]], reference: "How many nearby vectors the index considers before returning the top `limit`; more is more accurate but slower." },
  { id: "eventual-consistency", type: "answerable", question: "Why might a newly saved note not appear in vector search straight away?", sources: ["day-24", "day-25"], mustMention: [["background", "second", "eventual"]], reference: "Atlas updates vector indexes in the background, usually within a second or two (eventual consistency)." },
  { id: "embedding-limit", type: "answerable", question: "How much text can the course's local embedding model read at once?", sources: ["day-22", "day-23"], mustMention: ["128"], reference: "At most 128 tokens, roughly 80–100 words; the rest is cut off." },
  { id: "unchanged-files", type: "answerable", question: "How does the ingestion pipeline avoid re-embedding files that haven't changed?", sources: ["day-27"], mustMention: ["hash"], reference: "It stores a content hash for each file and skips files whose hash hasn't changed." },
  { id: "cited-text-cost", type: "answerable", question: "Does the cited_text in a citation count toward output tokens?", sources: ["day-29"], mustMention: [["doesn't", "does not", "not count", "no"]], reference: "No, cited_text doesn't count as output tokens." },
  { id: "scanned-pdf-status", type: "answerable", question: "What HTTP status does DocuChat return for a scanned PDF with no text?", sources: ["day-30"], mustMention: ["422"], reference: "422, with a clear error message." },
  { id: "rrf", type: "answerable", question: "What does reciprocal rank fusion use to merge result lists?", sources: ["day-31"], mustMention: ["rank"], reference: "Only each chunk's rank in each list (1 / (60 + rank)), not the raw scores." },
  { id: "cross-encoder", type: "answerable", question: "What's the difference between an embedding model and a cross-encoder reranker?", sources: ["day-32"], mustMention: [["together", "separately", "pair"]], reference: "An embedding model reads the question and each chunk separately; a cross-encoder reads them together, which is more accurate but slower." },
  { id: "history-small", type: "answerable", question: "Why does the Day 33 chat store only plain questions and answers in its history?", sources: ["day-33"], mustMention: [["small", "huge", "documents"]], reference: "The retrieved documents change every turn and would make the history huge, so only the plain text is kept." },
  { id: "cache-read-price", type: "answerable", question: "How much does reading from the prompt cache cost compared with normal input?", sources: ["day-34"], mustMention: [["0.1", "10%", "tenth"]], reference: "About 0.1× (10%) of the normal input price." },
  { id: "cache-minimum", type: "answerable", question: "What is the minimum prompt size that can be cached on Claude Opus 5?", sources: ["day-34"], mustMention: ["512"], reference: "512 tokens." },
  { id: "effort-low", type: "answerable", question: "When should you use low effort?", sources: ["day-08"], mustMention: [["chat", "classification", "speed", "simple"]], reference: "For chat, classification, simple extraction and anything where speed matters." },
  { id: "disconnect", type: "answerable", question: "What does the Day 12 server do when the browser disconnects mid-answer?", sources: ["day-12"], mustMention: ["abort"], reference: "It aborts the model's stream so you stop paying for tokens nobody will read." },
  { id: "history-limit", type: "answerable", question: "How many recent messages does the Day 13 server send to the model?", sources: ["day-13"], mustMention: ["20"], reference: "The last 20 messages (HISTORY_LIMIT)." },
  { id: "nepali-weather", type: "answerable", question: "मौसमको जानकारीका लागि पाठ्यक्रमले कुन निःशुल्क API प्रयोग गर्छ?", sources: ["day-17"], mustMention: ["Open-Meteo"], reference: "Open-Meteo (it needs no API key)." },
  { id: "exam-date", type: "unanswerable", question: "When is the final exam for this course?" },
  { id: "fees", type: "unanswerable", question: "How much does it cost to enrol in this course?" },
  { id: "day-50", type: "unanswerable", question: "What does the Day 50 lesson cover?" },
  { id: "kubernetes", type: "unanswerable", question: "How do I deploy DocuChat to Kubernetes?" },
  { id: "pass-grade", type: "unanswerable", question: "What grade do I need to pass the course?" },
  { id: "lab-wifi", type: "unanswerable", question: "What is the Wi-Fi password for the computer lab?" },
  { id: "capital", type: "unanswerable", question: "What is the capital of Australia?" },
  { id: "instructor-age", type: "unanswerable", question: "How old is the course instructor?" },
];
