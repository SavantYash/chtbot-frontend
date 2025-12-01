import { useEffect, useRef, useState } from "react";
import { socket } from "../sockets/socket";
import Message from "./Message";
import "./ChatBox.css";
import { get } from "../../helper/api_helper";
import { GET_ALL_MESSAGES } from "../../helper/url_helper";

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

    socket.emit("user:join", { sessionId });

    fetchmessages(sessionId)

    socket.on("receive:message", (message) => {
      if (message.sender === "admin") {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          return exists ? prev : [...prev, message];
        });
      }
    });

    socket.on("receive:private-message", (message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        return exists ? prev : [...prev, message];
      });
    });

    return () => {
      socket.off("receive:message");
      socket.off("receive:private-message");
    };
  }, []);

  const fetchmessages = async (sessionId) => {

    const res = await get(`${GET_ALL_MESSAGES}/${sessionId}`)
    if (res.status === 200) {
      const data = res.data

      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
    } else {
      console.error(res)
    }
  }

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
    setMessages((prev) => [...prev, message]);
    setText("");
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <div className="chatbox-header-content">
          <span>💬 Support Chat</span>
          <button onClick={close} className="chatbox-close">✕</button>
        </div>
      </div>

      <div className="chatbox-body">
        {isLoading ? (
          <div className="chatbox-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="chatbox-empty">No messages yet. Start chatting!</div>
        ) : (
          messages.map((msg, i) => (
            <Message key={i} msg={msg} self={msg.sender === "user"} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chatbox-footer">
        <input
          className="chatbox-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type message..."
        />
        <button onClick={sendMessage} className="chatbox-send">⬆</button>
      </div>
    </div>
  );
}
