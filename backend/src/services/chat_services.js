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
    "SELECT id, sender, content, created_at FROM messages WHERE user_id=$1 ORDER BY created_at ASC",
    [user.rows[0].id]
  );

  return messages.rows;
}

async function getAllMessages() {
  const messages = await pool.query(
    `SELECT m.id, m.sender, m.content, m.created_at, u.session_id
     FROM messages m
     JOIN users u ON m.user_id = u.id
     ORDER BY m.created_at DESC
     LIMIT 1000`
  );
  return messages.rows;
}

async function getMessageStats() {
  const stats = await pool.query(
    `SELECT 
      COUNT(DISTINCT u.id) as total_users,
      COUNT(m.id) as total_messages,
      SUM(CASE WHEN m.sender = 'user' THEN 1 ELSE 0 END) as user_messages,
      SUM(CASE WHEN m.sender = 'admin' THEN 1 ELSE 0 END) as admin_messages
     FROM users u
     LEFT JOIN messages m ON u.id = m.user_id`
  );
  return stats.rows[0];
}

async function getLastMessageByUser(sessionId) {
  const result = await pool.query(
    `SELECT m.content, m.created_at
     FROM messages m
     JOIN users u ON m.user_id = u.id
     WHERE u.session_id = $1
     ORDER BY m.created_at DESC
     LIMIT 1`,
    [sessionId]
  );
  return result.rows[0] || null;
}

module.exports = {
  findOrCreateUser,
  saveMessage,
  getAllUsers,
  getMessagesBySession,
  getAllMessages,
  getMessageStats,
  getLastMessageByUser
};
