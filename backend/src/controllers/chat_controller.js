const {
  getAllUsers,
  getMessagesBySession,
  getAllMessages,
  getMessageStats
} = require("../services/chat_services");

exports.fetchUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchMessages = async (req, res) => {
  try {
    const messages = await getMessagesBySession(req.params.sessionId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchAllLogs = async (req, res) => {
  try {
    const logs = await getAllMessages();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchMessageStats = async (req, res) => {
  try {
    const stats = await getMessageStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
