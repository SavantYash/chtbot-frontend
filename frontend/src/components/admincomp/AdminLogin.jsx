import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate auth delay
    setTimeout(() => {
      if (user === "admin" && pass === "1234") {
        localStorage.setItem("adminAuth", "true");
        navigate("/admin/dashboard");
      } else {
        setError("Invalid username or password");
        setPass("");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🤖 ChatBot Admin</h1>
          <p>Admin Dashboard Login</p>
        </div>

        <form onSubmit={login} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <small>Demo: admin / 1234</small>
        </div>
      </div>
    </div>
  );
}
