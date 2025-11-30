const {
  findOrCreateUser,
  saveMessage,
  getMessagesBySession
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
      
      // Send all connected users first
      socket.emit("receive:users", connectedUsers);
      
      // Load and send all message history for each user
      for (const sessionId of connectedUsers) {
        try {
          const messages = await getMessagesBySession(sessionId);
          if (messages.length > 0) {
            messages.forEach((msg) => {
              socket.emit("receive:message", {
                sessionId,
                ...msg
              });
            });
          }
        } catch (err) {
          console.error("Error loading messages for admin:", err);
        }
      }
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

    /* USER-TO-USER MESSAGE */
    socket.on("user:private-message", async ({ fromSessionId, toSessionId, content }) => {
      try {
        const fromUser = await findOrCreateUser(fromSessionId);

        const message = await saveMessage(
          fromUser.id,
          "user",
          content
        );

        // Send to specific user
        io.to(toSessionId).emit("receive:private-message", {
          fromSessionId,
          toSessionId,
          ...message
        });

        // Also notify admin
        io.to("admin").emit("receive:message", {
          sessionId: fromSessionId,
          ...message
        });
      } catch (err) {
        console.error("Error saving user private message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
      // Remove from connected users
      connectedUsers = connectedUsers.filter(u => u !== socket.id);
      io.to("admin").emit("receive:users", connectedUsers);
    });
  });
};
