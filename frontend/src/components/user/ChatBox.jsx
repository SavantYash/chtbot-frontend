import { useEffect, useState } from "react";
import { socket } from "../sockets/socket";
import Message from "./Message";

export default function ChatBox({ close }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.connect();

    let sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("sessionId", sessionId);
    }

    socket.emit("user:join", { sessionId });

    socket.on("receive:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receive:message");
    };
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;

    const sessionId = localStorage.getItem("sessionId");

    const message = {
      sessionId,
      content: text,
      sender: "user",
      timestamp: new Date().toISOString()
    };

    socket.emit("user:message", message);
    setMessages((prev) => [...prev, message]);
    setText("");
  };

  return (
    <div style={styles.box}>
      <div style={styles.header}>
        <strong>Support Chat</strong>
        <button onClick={close}>X</button>
      </div>

      <div style={styles.body}>
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} self={msg.sender === "user"} />
        ))}
      </div>

      <div style={styles.footer}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={{ flex: 1 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

const styles = {
  box: {
    position: "fixed",
    bottom: "80px",
    right: "20px",
    width: "300px",
    height: "400px",
    background: "#fff",
    border: "1px solid gray",
    display: "flex",
    flexDirection: "column"
  },
  header: { padding: "10px", borderBottom: "1px solid gray" },
  body: { flex: 1, padding: "10px", overflowY: "auto" },
  footer: { display: "flex", padding: "10px", gap: "5px" }
};
