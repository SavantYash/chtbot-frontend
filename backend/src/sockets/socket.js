const {
  findOrCreateUser,
  saveMessage,
  getLastMessageByUser
} = require("../services/chat_services");

let connectedUsers = [];

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /* USER JOIN */
    socket.on("user:join", async ({ sessionId }) => {
      const user = await findOrCreateUser(sessionId);

      socket.join(sessionId);

      if (!connectedUsers.includes(sessionId)) {
        connectedUsers.push(sessionId);
      }

      // Broadcast updated user list to all admins
      io.to("admin").emit("receive:users", connectedUsers);
    });

    /* USER MESSAGE */
    socket.on("user:message", async ({ sessionId, content }) => {
      try {
        const user = await findOrCreateUser(sessionId);

        const message = await saveMessage(
          user.id,
          "user",
          content
        );

        // Only send to admin - user already has the message from optimistic update
        io.to("admin").emit("receive:message", {
          sessionId,
          ...message
        });
      } catch (err) {
        console.error("Error saving user message:", err);
      }
    });

    /* ADMIN JOIN */
    socket.on("admin:join", async () => {
      socket.join("admin");
      socket.emit("receive:users", connectedUsers);
    });

    /* ADMIN MESSAGE */
    socket.on("admin:message", async ({ sessionId, content }) => {
      try {
        const user = await findOrCreateUser(sessionId);

        const message = await saveMessage(
          user.id,
          "admin",
          content
        );

        // Send to specific user
        io.to(sessionId).emit("receive:message", {
          sessionId,
          ...message
        });

        // Also notify all admins
        io.to("admin").emit("receive:message", {
          sessionId,
          ...message
        });
      } catch (err) {
        console.error("Error saving admin message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });
};
