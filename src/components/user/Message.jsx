export default function Message({ msg, self }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: "4px", alignItems: self ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "80%",
          padding: "8px 12px",
          borderRadius: "12px",
          background: self ? "#4f46e5" : "white",
          color: self ? "white" : "#2c3e50",
          fontSize: "13px",
          wordWrap: "break-word",
          boxShadow: self ? "0 2px 6px rgba(79, 70, 229, 0.2)" : "0 1px 2px rgba(0, 0, 0, 0.05)",
          border: self ? "none" : "1px solid #e1e4e8"
        }}
      >
        {msg.content}
      </div>
      <small style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
        {formatTime(msg.created_at)}
      </small>
    </div>
  );
}
