export default function Message({ msg, self }) {
  return (
    <div
      style={{
        textAlign: self ? "right" : "left",
        margin: "5px 0"
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: "10px",
          background: self ? "#DCF8C6" : "#eee"
        }}
      >
        {msg.content}
      </span>
    </div>
  );
}
