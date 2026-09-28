// Checks the messages array a client sent before we pay to send it to the model.
// Days 12 and 13 reuse this file.
const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MESSAGE = 4000;

export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > MAX_MESSAGES) return `send at most ${MAX_MESSAGES} messages`;
  for (const [i, m] of messages.entries()) {
    if (!["user", "assistant"].includes(m?.role)) return `messages[${i}].role must be "user" or "assistant"`;
    if (typeof m.content !== "string" || !m.content.trim()) return `messages[${i}].content must be text`;
    if (m.content.length > MAX_CHARS_PER_MESSAGE) return `messages[${i}] is too long`;
  }
  if (messages[0].role !== "user") return "the first message must be from the user";
  if (messages.at(-1).role !== "user") return "the last message must be from the user";
  return null;
}
