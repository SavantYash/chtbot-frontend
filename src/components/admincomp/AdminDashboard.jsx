import { useEffect, useRef, useState } from "react";
import { socket } from "../sockets/socket";
import "./admin.css";
import { get } from "../../helper/api_helper";
import { GET_ALL_LOGS, GET_ALL_MESSAGES, GET_ALL_USERS } from "../../helper/url_helper";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [view, setView] = useState("chats");
  const [allLogs, setAllLogs] = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (view === "logs") {
      fetchAllLogs()
    }
  }, [view]);

  const fetchAllLogs = async () => {
    try {
      const res = await get(GET_ALL_LOGS)
      if (res.status === 200) {
        const data = res.data
        if (Array.isArray(data)) setAllLogs(data);
      } else {
        console.error(res)
      }
    } catch (err) {
      console.log(err)
    }
  }


  useEffect(() => {
    fetchUsers()
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await get(GET_ALL_USERS)
      if (res.status === 200) {
        const data = res.data
        if (Array.isArray(data)) {
          setUsers(data.map(user => user.session_id));
        }
      }
      else {
        console.error(res)
      }
    } catch (err) {
      console.log(err)
    }
  }


  useEffect(() => {
    socket.connect();
    socket.emit("admin:join");

    socket.on("receive:users", (data) => {
      setUsers(data);
    });

    socket.on("receive:message", (msg) => {
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

  const loadMessages = async (sessionId) => {
    setActiveUser(sessionId);

    try {

      const res = await get(`${GET_ALL_MESSAGES}/${sessionId}`)
      let data = []
      if (res.status === 200) {
        data = res.data
      } else {
        console.error(res)
      }

      if (Array.isArray(data)) {
        setMessages(data);
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
