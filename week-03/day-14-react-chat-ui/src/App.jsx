import { useEffect, useState } from "react";
import * as api from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");

  const refreshList = () => api.listConversations().then(setConversations).catch((e) => setError(e.message));

  useEffect(() => {
    refreshList();
  }, []);

  async function handleNewChat() {
    try {
      const conversation = await api.createConversation();
      setActiveId(conversation._id);
      refreshList();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    await api.deleteConversation(id).catch((e) => setError(e.message));
    if (id === activeId) setActiveId(null);
    refreshList();
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNewChat}
        onDelete={handleDelete}
      />
      <main>
        {error && (
          <div className="banner" onClick={() => setError("")}>
            {error} (click to dismiss)
          </div>
        )}
        {activeId ? (
          // key={activeId} gives each conversation a fresh ChatWindow with its own state
          <ChatWindow key={activeId} conversationId={activeId} onReply={refreshList} />
        ) : (
          <div className="empty">
            <h1>AI Chat</h1>
            <button onClick={handleNewChat}>Start a new chat</button>
          </div>
        )}
      </main>
    </div>
  );
}
