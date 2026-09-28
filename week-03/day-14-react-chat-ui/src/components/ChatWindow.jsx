import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import * as api from "../api.js";

export default function ChatWindow({ conversationId, onReply }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  // Load the saved messages when the conversation opens
  useEffect(() => {
    api
      .getConversation(conversationId)
      .then((c) => setMessages(c.messages))
      .catch((e) => setError(e.message));
  }, [conversationId]);

  // Keep the newest text in view while it streams in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content || streaming) return;

    setInput("");
    setError("");
    // Show the user's message and an empty assistant bubble that fills up as text arrives
    setMessages((prev) => [...prev, { role: "user", content }, { role: "assistant", content: "" }]);
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      await api.sendMessage(conversationId, content, {
        signal: abortRef.current.signal,
        onText: (text) =>
          setMessages((prev) => {
            const last = prev.at(-1);
            return [...prev.slice(0, -1), { ...last, content: last.content + text }];
          }),
      });
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    }
    setStreaming(false);
    onReply(); // the sidebar title may have changed
  }

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === "assistant" ? (
              // react-markdown doesn't render raw HTML by default, so model output can't inject scripts
              m.content ? <Markdown>{m.content}</Markdown> : <span className="typing">●●●</span>
            ) : (
              m.content
            )}
          </div>
        ))}
        {error && <div className="msg error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={handleSend}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a new line
            if (e.key === "Enter" && !e.shiftKey) handleSend(e);
          }}
          placeholder="Ask something... (Shift+Enter for a new line)"
          rows={2}
        />
        {streaming ? (
          <button type="button" onClick={() => abortRef.current.abort()}>
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()}>
            Send
          </button>
        )}
      </form>
    </div>
  );
}
