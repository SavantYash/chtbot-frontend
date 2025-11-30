const {
  getAllUsers,
  getMessagesBySession,
  getUsersWithLastMessage
} = require("../services/chat_services");

exports.fetchUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchUsersWithLastMessage = async (req, res) => {
  try {
    const users = await getUsersWithLastMessage();
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
