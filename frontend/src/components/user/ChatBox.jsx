import { useEffect, useRef, useState } from "react";
import { socket } from "../sockets/socket";
import Message from "./Message";

export default function ChatBox({ close }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    let sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("sessionId", sessionId);
    }

    sessionIdRef.current = sessionId;

    // Join user room
    socket.emit("user:join", { sessionId });

    // ✅ LOAD PREVIOUS MESSAGES FROM BACKEND
    fetch(`http://localhost:4000/messages/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setMessages([]);
        setIsLoading(false);
      });

    // ✅ LIVE MESSAGES FROM SOCKET (admin responses)
    socket.on("receive:message", (message) => {
      // Only add admin messages, user messages are added optimistically
      if (message.sender === "admin") {
        setMessages((prev) => {
          const msgExists = prev.some(m => m.id === message.id);
          return msgExists ? prev : [...prev, message];
        });
      }
    });

    // ✅ RECEIVE PRIVATE MESSAGES FROM OTHER USERS
    socket.on("receive:private-message", (message) => {
      setMessages((prev) => {
        const msgExists = prev.some(m => m.id === message.id);
        return msgExists ? prev : [...prev, message];
      });
    });

    return () => {
      socket.off("receive:message");
      socket.off("receive:private-message");
    };
  }, []);

  // ✅ Auto scroll when new message added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const message = {
      sessionId: sessionIdRef.current,
      content: text,
      sender: "user",
      created_at: new Date().toISOString()
    };

    socket.emit("user:message", message);

    // Optimistic UI update
    setMessages((prev) => [...prev, message]);
    setText("");
  };

  return (
    <div style={styles.box}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span>💬 Support Chat</span>
          <button onClick={close} style={styles.closeBtn}>✕</button>
        </div>
      </div>

      <div style={styles.body}>
        {isLoading ? (
          <div style={styles.loading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.empty}>No messages yet. Start chatting!</div>
        ) : (
          messages.map((msg, i) => (
            <Message key={i} msg={msg} self={msg.sender === "user"} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.footer}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendBtn}>⬆</button>
      </div>
    </div>
  );
}

const styles = {
  box: {
    position: "fixed",
    bottom: "80px",
    right: "20px",
    width: "360px",
    height: "500px",
    background: "white",
    border: "none",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 5px 40px rgba(0, 0, 0, 0.16)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    zIndex: 9999
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #e1e4e8",
    background: "white",
    borderRadius: "12px 12px 0 0"
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#2c3e50",
    fontWeight: "600",
    fontSize: "14px"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#999",
    padding: "0",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s"
  },
  body: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    background: "#fafbfc",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#999",
    fontSize: "13px"
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#999",
    fontSize: "13px",
    textAlign: "center"
  },
  footer: {
    padding: "12px 16px",
    display: "flex",
    gap: "8px",
    borderTop: "1px solid #e1e4e8",
    background: "white",
    borderRadius: "0 0 12px 12px"
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid #e1e4e8",
    borderRadius: "20px",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.2s",
    background: "#eef2ff",
    color: "#1f2937"
  },
  sendBtn: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0
  }
};
