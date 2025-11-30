const express = require("express");
const {
  fetchUsers,
  fetchMessages,
  fetchAllLogs,
  fetchMessageStats
} = require("../controllers/chat_controller");

const router = express.Router();

router.get("/users", fetchUsers);
router.get("/messages/:sessionId", fetchMessages);
router.get("/logs/all", fetchAllLogs);
router.get("/stats", fetchMessageStats);

module.exports = router;
