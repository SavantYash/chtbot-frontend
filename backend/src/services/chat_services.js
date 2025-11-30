const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

async function findOrCreateUser(sessionId) {
  const user = await pool.query(
    "SELECT * FROM users WHERE session_id=$1",
    [sessionId]
  );

  if (user.rows.length > 0) return user.rows[0];

  const newUser = await pool.query(
    "INSERT INTO users (id, session_id) VALUES ($1,$2) RETURNING *",
    [uuidv4(), sessionId]
  );

  return newUser.rows[0];
}

async function saveMessage(userId, sender, content) {
  const message = await pool.query(
    "INSERT INTO messages (id, user_id, sender, content) VALUES ($1,$2,$3,$4) RETURNING *",
    [uuidv4(), userId, sender, content]
  );

  return message.rows[0];
}

async function getAllUsers() {
  const users = await pool.query(
    "SELECT session_id, created_at FROM users ORDER BY created_at DESC"
  );
  return users.rows;
}

async function getMessagesBySession(sessionId) {
  const user = await pool.query(
    "SELECT id FROM users WHERE session_id=$1",
    [sessionId]
  );

  if (user.rows.length === 0) return [];

  const messages = await pool.query(
    "SELECT sender, content, created_at FROM messages WHERE user_id=$1 ORDER BY created_at ASC",
    [user.rows[0].id]
  );

  return messages.rows;
}

async function getUsersWithLastMessage() {
  const result = await pool.query(
    `SELECT 
      u.session_id,
      u.created_at,
      m.content as last_message,
      m.created_at as last_message_time
    FROM users u
    LEFT JOIN messages m ON u.id = (
      SELECT user_id FROM messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
    ) AND m.user_id = u.id
    ORDER BY COALESCE(m.created_at, u.created_at) DESC`
  );
  return result.rows;
}

module.exports = {
  findOrCreateUser,
  saveMessage,
  getAllUsers,
  getMessagesBySession,
  getUsersWithLastMessage
};
