// 5 questions the course lessons CAN answer, and 5 they CAN'T.
// A good RAG system answers the first group correctly and says "I don't know" to the second.
export const testQuestions = [
  { question: "Which free weather and exchange rate APIs are used, and do they need a key?", answerable: true },
  { question: "Why should the browser never call the LLM API directly?", answerable: true },
  { question: "What does 'eventual consistency' mean for Atlas vector search?", answerable: true },
  { question: "Which chunking strategy scored best on Day 23?", answerable: true },
  { question: "What are the two defences in the Day 19 prompt injection lesson?", answerable: true },
  { question: "How do I deploy the course app to Kubernetes?", answerable: false },
  { question: "What is the exam date for this course?", answerable: false },
  { question: "What grade do I need to pass the course?", answerable: false },
  { question: "How much does the course cost to enrol in?", answerable: false },
  { question: "What does the Day 50 lesson cover?", answerable: false },
];
