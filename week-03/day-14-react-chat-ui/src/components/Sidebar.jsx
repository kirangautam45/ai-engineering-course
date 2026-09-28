export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  return (
    <aside className="sidebar">
      <button className="new-chat" onClick={onNew}>
        + New chat
      </button>
      <ul>
        {conversations.map((c) => (
          <li key={c._id} className={c._id === activeId ? "active" : ""}>
            <button className="title" onClick={() => onSelect(c._id)}>
              {c.title}
            </button>
            <button className="delete" aria-label={`Delete ${c.title}`} onClick={() => onDelete(c._id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
