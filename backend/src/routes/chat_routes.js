const express = require("express");
const {
  fetchUsers,
  fetchMessages,
  fetchUsersWithLastMessage
} = require("../controllers/chat_controller");

const router = express.Router();

router.get("/users", fetchUsers);
router.get("/users-with-messages", fetchUsersWithLastMessage);
router.get("/messages/:sessionId", fetchMessages);

module.exports = router;
