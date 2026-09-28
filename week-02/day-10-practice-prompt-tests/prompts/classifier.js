// Classifies a support message into exactly one category.
export default {
  name: "classifier",
  version: 2, // bump this every time you change the prompt, and write why in CHANGELOG below
  effort: "low", // classification is easy — low effort is faster and cheaper
  system: `You sort messages sent to a college IT help desk into one category.
Reply with only the category name, exactly as written below, and nothing else,
because a program reads your answer.

Categories:
- wifi: campus Wi-Fi or internet problems
- account: login, password or email account problems
- lab: computer lab machines, printers or software installs
- other: anything else`,
  build: (input) => input,
  tests: [
    { input: "The wifi in the library keeps disconnecting", expect: "wifi" },
    { input: "I forgot my student portal password", expect: "account" },
    { input: "Printer in Lab 3 is out of toner", expect: "lab" },
    { input: "When does the canteen open?", expect: "other" },
    { input: "cant log in to my college gmail since morning", expect: "account" },
    { input: "Can you install VS Code on the lab 2 PCs before Monday?", expect: "lab" },
  ],
  // Exact match after trimming and lowercasing
  check: (output, test) => output.trim().toLowerCase() === test.expect,
};

// CHANGELOG
// v1: "Classify this message as wifi, account, lab or other." — sometimes replied with a full sentence.
// v2: listed the categories with descriptions and explained that a program reads the answer.
