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
  const [allLogs, setAllLogs] = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (view === "logs") {
      fetch("http://localhost:4000/logs/all")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAllLogs(data);
        })
        .catch(err => console.error(err));
    }
  }, [view]);


  useEffect(() => {
    fetch("http://localhost:4000/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data.map(user => user.session_id));
        }
      })
      .catch(err => console.error(err));
  }, []);


  useEffect(() => {
    socket.connect();
    socket.emit("admin:join");

    socket.on("receive:users", (data) => {
      setUsers(data);
    });

    socket.on("receive:message", (msg) => {
      // Update user details with last message and store all messages (avoid duplicates)
      setUserDetails((prev) => {
        const existing = prev[msg.sessionId] || {};
        const msgExists = existing.messages?.some(m => m.id === msg.id);

        return {
          ...prev,
          [msg.sessionId]: {
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            messageCount: msgExists ? (prev[msg.sessionId]?.messageCount || 0) : (prev[msg.sessionId]?.messageCount || 0) + 1,
            messages: msgExists
              ? existing.messages
              : [...(existing.messages || []), msg]
          }
        };
      });

      if (msg.sessionId === activeUser) {
        setMessages((prev) => {
          const msgExists = prev.some(m => m.id === msg.id);
          return msgExists ? prev : [...prev, msg];
        });
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
        // Count messages for stats and store all messages
        const userMessageCount = data.length;
        setUserDetails((prev) => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            messageCount: userMessageCount,
            messages: data,
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

          <div className="logs-content">
            <div className="logs-summary">
              <div className="summary-stat">
                <span className="stat-label">Total Users:</span>
                <span className="stat-value">{users.length}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Total Messages:</span>
                <span className="stat-value">{Object.values(userDetails).reduce((sum, u) => sum + (u.messageCount || 0), 0)}</span>
              </div>
            </div>

            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Sender</th>
                    <th>Message</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {/* {Object.entries(userDetails).length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                        No messages yet
                      </td>
                    </tr>
                  ) : (
                    users.flatMap((userId) =>
                      Array.isArray(userDetails[userId]?.messages) && userDetails[userId].messages.length > 0
                        ? userDetails[userId].messages.map((msg, idx) => (
                          <tr key={`${userId}-${idx}`}>
                            <td className="user-id-col">{userId.substring(0, 12)}...</td>
                            <td className="sender-col">
                              <span className={`badge badge-${msg.sender}`}>
                                {msg.sender === "user" ? "👤 User" : "👨‍💼 Admin"}
                              </span>
                            </td>
                            <td className="message-col">{msg.content}</td>
                            <td className="time-col">{formatTime(msg.created_at)}</td>
                          </tr>
                        ))
                        : []
                    )
                  )} */}
                  {allLogs.map((msg, index) => (
                    <tr key={index}>
                      <td className="user-id-col">{msg.session_id.substring(0, 12)}...</td>
                      <td className="sender-col">
                        <span className={`badge badge-${msg.sender}`}>
                          {msg.sender === "user" ? "👤 User" : "👨‍💼 Admin"}
                        </span>
                      </td>
                      <td className="message-col">{msg.content}</td>
                      <td className="time-col">{formatTime(msg.created_at)}</td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
