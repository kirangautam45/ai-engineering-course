// Summarizes a notice into one short sentence for an SMS alert.
export default {
  name: "summarizer",
  version: 1,
  effort: "low",
  system: `You write one-sentence SMS alerts for college students.
The sentence must be at most 20 words, because SMS space is limited.
Always keep dates, times and places exactly as written, because students act on them.
Reply with the sentence only.`,
  build: (input) => `<notice>\n${input}\n</notice>`,
  tests: [
    {
      input: `Dear students, due to the public holiday the mid-term exam of Computer Networks
scheduled for Sunday has been postponed. The new date is Tuesday, 10 AM, in Hall B.
All other exams remain unchanged. — Exam Section`,
      mustInclude: ["Tuesday", "10", "Hall B"],
    },
    {
      input: `The library will stay open until 9 PM every day from next week to help students
prepare for the board exams. Please carry your ID card after 6 PM.`,
      mustInclude: ["9 PM", "ID"],
    },
    {
      input: `Registration for the inter-college hackathon closes on Friday at midnight.
Teams of 2 to 4 can register at the IT department office, room 204.`,
      mustInclude: ["Friday", "204"],
    },
  ],
  check: (output, test) => {
    const words = output.trim().split(/\s+/).length;
    const missing = test.mustInclude.filter((text) => !output.includes(text));
    if (words > 20) return `too long (${words} words)`;
    if (missing.length) return `missing: ${missing.join(", ")}`;
    return true;
  },
};
