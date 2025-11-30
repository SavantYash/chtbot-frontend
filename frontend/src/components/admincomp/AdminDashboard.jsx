import { useEffect, useState } from "react";
import { socket } from "../sockets/socket";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.connect();
    socket.emit("admin:join");

    socket.on("receive:users", (data) => {
      setUsers(data);
    });

    socket.on("receive:message", (msg) => {
      if (msg.sessionId === activeUser) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receive:users");
      socket.off("receive:message");
    };
  }, [activeUser]);

  const sendMessage = () => {
    if (!text || !activeUser) return;

    const msg = {
      sessionId: activeUser,
      content: text,
      sender: "admin",
      timestamp: new Date().toISOString()
    };

    socket.emit("admin:message", msg);
    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "30%", borderRight: "1px solid gray" }}>
        <h3>Users</h3>
        {users.map((u) => (
          <div key={u} onClick={() => { setActiveUser(u); setMessages([]); }}>
            {u}
          </div>
        ))}
      </div>

      <div style={{ width: "70%" }}>
        <h3>Chat</h3>

        <div style={{ height: "350px", overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i}>{m.content}</div>
          ))}
        </div>

        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
