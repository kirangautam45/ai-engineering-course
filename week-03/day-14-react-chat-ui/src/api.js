// All calls to the Day 13 server live here, so components stay simple.

async function request(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

export const listConversations = () => request("/api/conversations");
export const getConversation = (id) => request(`/api/conversations/${id}`);
export const createConversation = () => request("/api/conversations", { method: "POST" });
export const deleteConversation = (id) => request(`/api/conversations/${id}`, { method: "DELETE" });

// Sends a message and calls onText(chunk) for every piece of the reply as it streams in.
// Pass an AbortSignal to be able to stop it.
export async function sendMessage(id, content, { onText, signal }) {
  const res = await fetch(`/api/conversations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const events = buffer.split("\n\n");
    buffer = events.pop(); // keep the incomplete last piece for the next read

    for (const raw of events) {
      if (!raw.startsWith("data: ")) continue;
      const event = JSON.parse(raw.slice(6));
      if (event.type === "text") onText(event.text);
      if (event.type === "error") throw new Error(event.message);
    }
  }
}
