import { useEffect, useRef, useState } from "react";
import { socket } from "../sockets/socket";
import "./admin.css";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [view, setView] = useState("chats"); // "chats" or "logs"

  const bottomRef = useRef(null);

  useEffect(() => {
    socket.connect();
    socket.emit("admin:join");

    socket.on("receive:users", (data) => {
      setUsers(data);
    });

    socket.on("receive:message", (msg) => {
      // Update user details with last message
      setUserDetails((prev) => ({
        ...prev,
        [msg.sessionId]: {
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          messageCount: (prev[msg.sessionId]?.messageCount || 0) + 1
        }
      }));

      if (msg.sessionId === activeUser) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receive:users");
      socket.off("receive:message");
    };
  }, [activeUser]);

  // ✅ Load previous messages for selected user
  const loadMessages = async (sessionId) => {
    setActiveUser(sessionId);

    try {
      const res = await fetch(`http://localhost:4000/messages/${sessionId}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setMessages(data);
        // Count messages for stats
        const userMessageCount = data.length;
        setUserDetails((prev) => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            messageCount: userMessageCount,
            lastMessage: data.length > 0 ? data[data.length - 1].content : "No messages",
            lastMessageTime: data.length > 0 ? data[data.length - 1].created_at : null
          }
        }));
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages([]);
    }
  };

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text || !activeUser) return;

    const msg = {
      sessionId: activeUser,
      content: text,
      sender: "admin"
    };

    socket.emit("admin:message", msg);
    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  // ✅ Export logs as JSON
  const exportLogs = () => {
    const logsData = {
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      users: users.map((u) => ({
        sessionId: u,
        ...userDetails[u]
      }))
    };

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(logsData, null, 2))
    );
    element.setAttribute("download", `chatbot-logs-${Date.now()}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="admin-container">
      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <h2>📊 Admin</h2>
        <div className="menu">
          <div
            className={view === "chats" ? "active" : ""}
            onClick={() => setView("chats")}
          >
            💬 Chats
          </div>
          <div
            className={view === "logs" ? "active" : ""}
            onClick={() => setView("logs")}
          >
            📋 Logs
          </div>
        </div>
        <div className="stats">
          <div className="stat-item">
            <small>Total Users</small>
            <strong>{users.length}</strong>
          </div>
          <div className="stat-item">
            <small>Total Messages</small>
            <strong>{Object.values(userDetails).reduce((sum, u) => sum + (u.messageCount || 0), 0)}</strong>
          </div>
        </div>
      </div>

      {view === "chats" ? (
        <>
          {/* USER LIST */}
          <div className="users-panel">
            <h3>Active Users</h3>
            {users.length === 0 && <p className="no-users">No active users</p>}

            {users.map((u, i) => (
              <div
                key={i}
                className={`user-item ${activeUser === u ? "selected" : ""}`}
                onClick={() => loadMessages(u)}
              >
                <div className="user-info">
                  <div className="user-id">{u.substring(0, 8)}...</div>
                  <div className="user-meta">
                    <small>{userDetails[u]?.lastMessage?.substring(0, 20) || "No messages"}</small>
                    <small className="time">{formatTime(userDetails[u]?.lastMessageTime)}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CHAT PANEL */}
          <div className="chat-panel">
            {!activeUser && (
              <div className="no-user">
                Select a user to start chatting
              </div>
            )}

            {activeUser && (
              <>
                <div className="chat-header">
                  <div>
                    <strong>User: {activeUser}</strong>
                    <small> · {messages.length} messages</small>
                  </div>
                </div>

                <div className="messages">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`message-wrapper`}
                    >
                      <div className={`message ${m.sender === "admin" ? "admin-msg" : "user-msg"}`}>
                        {m.content}
                      </div>
                      <small className="msg-time">{formatTime(m.created_at)}</small>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="chat-input">
                  <input
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button onClick={sendMessage}>➤</button>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* LOGS VIEW */
        <div className="logs-panel">
          <div className="logs-header">
            <h2>Message Logs</h2>
            <button onClick={exportLogs} className="export-btn">
              📥 Export Logs
            </button>
          </div>

          <div className="logs-table">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Last Message</th>
                  <th>Message Count</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No users
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={i}>
                      <td>{u.substring(0, 12)}...</td>
                      <td className="truncate">
                        {userDetails[u]?.lastMessage || "—"}
                      </td>
                      <td>{userDetails[u]?.messageCount || 0}</td>
                      <td>{formatTime(userDetails[u]?.lastMessageTime)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
