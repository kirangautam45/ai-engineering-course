// Questions whose answers are buried inside one lesson's README, with the file that answers them.
// This is a tiny "eval set": it lets us MEASURE which chunking strategy works best (more in Week 8).
export const testQueries = [
  { query: "stop generating when the user closes the browser tab", expect: "day-12" },
  { query: "never commit your API key to GitHub", expect: "day-01" },
  { query: "count tokens before sending a request", expect: "day-02" },
  { query: "an email contains hidden instructions for the assistant", expect: "day-19" },
  { query: "send all tool results back in one message", expect: "day-17" },
  { query: "save the partial answer if the user presses stop", expect: "day-13" },
  { query: "render Markdown without allowing raw HTML", expect: "day-14" },
  { query: "the output must match a Zod schema", expect: "day-09" },
  { query: "examples should be varied so the model doesn't copy them", expect: "day-07" },
  { query: "thinking is billed as output tokens", expect: "day-08" },
  { query: "why the model can't be allowed to run eval() on text", expect: "day-16" },
  { query: "flaky tests that only pass sometimes", expect: "day-10" },
];
