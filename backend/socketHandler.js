const { v4: uuidv4 } = require("uuid");
const pool = require("./db");

let connectedUsers = [];

function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // USER CONNECT
    socket.on("user:join", async ({ sessionId }) => {
      try {
        const check = await pool.query(
          "SELECT * FROM users WHERE session_id = $1",
          [sessionId]
        );

        let userId;

        if (check.rows.length === 0) {
          const newUser = await pool.query(
            "INSERT INTO users (id, session_id) VALUES ($1, $2) RETURNING *",
            [uuidv4(), sessionId]
          );

          userId = newUser.rows[0].id;
        } else {
          userId = check.rows[0].id;
        }

        socket.join(sessionId);

        if (!connectedUsers.includes(sessionId)) {
          connectedUsers.push(sessionId);
        }

        io.emit("receive:users", connectedUsers);
      } catch (err) {
        console.error(err.message);
      }
    });

    // USER MESSAGE
    socket.on("user:message", async (data) => {
      try {
        const { sessionId, content } = data;

        const user = await pool.query(
          "SELECT id FROM users WHERE session_id = $1",
          [sessionId]
        );

        if (user.rows.length === 0) return;

        const userId = user.rows[0].id;

        const message = await pool.query(
          "INSERT INTO messages (id, user_id, sender, content) VALUES ($1,$2,$3,$4) RETURNING *",
          [uuidv4(), userId, "user", content]
        );

        io.to("admin").emit("receive:message", {
          sessionId,
          ...message.rows[0]
        });

      } catch (err) {
        console.error(err.message);
      }
    });

    // ADMIN CONNECT
    socket.on("admin:join", () => {
      socket.join("admin");
      socket.emit("receive:users", connectedUsers);
    });

    // ADMIN MESSAGE
    socket.on("admin:message", async (data) => {
      try {
        const { sessionId, content } = data;

        const user = await pool.query(
          "SELECT id FROM users WHERE session_id = $1",
          [sessionId]
        );

        if (user.rows.length === 0) return;

        const userId = user.rows[0].id;

        const message = await pool.query(
          "INSERT INTO messages (id, user_id, sender, content) VALUES ($1,$2,$3,$4) RETURNING *",
          [uuidv4(), userId, "admin", content]
        );

        // Send ONLY to specific user
        io.to(sessionId).emit("receive:message", {
          sessionId,
          ...message.rows[0]
        });

      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = setupSocket;
