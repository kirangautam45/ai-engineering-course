// Terminal input helpers shared by the Week 4 lessons.
import readline from "node:readline/promises";

export const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// The tool runner runs tool calls in parallel. If two tools ask for confirmation at the
// same time, their questions would get mixed up, so we queue them: one question at a time.
let queue = Promise.resolve();

export function confirm(description) {
  const answer = queue.then(async () => {
    const reply = await rl.question(`\n✋ ${description}\n   Go ahead? (y/n) `);
    return reply.trim().toLowerCase() === "y";
  });
  queue = answer.catch(() => {}); // a failed question mustn't block the ones after it
  return answer;
}
