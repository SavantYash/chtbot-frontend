const {
  findOrCreateUser,
  saveMessage,
  getMessagesBySession
} = require("../services/chat_services");

let connectedUsers = [];

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("user:join", async ({ sessionId }) => {
      const user = await findOrCreateUser(sessionId);

      socket.join(sessionId);

      if (!connectedUsers.includes(sessionId)) {
        connectedUsers.push(sessionId);
      }

      io.to("admin").emit("receive:users", connectedUsers);
    });

    socket.on("user:message", async ({ sessionId, content }) => {
      try {
        const user = await findOrCreateUser(sessionId);

        const message = await saveMessage(
          user.id,
          "user",
          content
        );

        io.to("admin").emit("receive:message", {
          sessionId,
          ...message
        });
      } catch (err) {
        console.error("Error saving user message:", err);
      }
    });

    socket.on("admin:join", async () => {
      socket.join("admin");
      
      socket.emit("receive:users", connectedUsers);
      
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

    socket.on("admin:message", async ({ sessionId, content }) => {
      try {
        const user = await findOrCreateUser(sessionId);

        const message = await saveMessage(
          user.id,
          "admin",
          content
        );

        io.to(sessionId).emit("receive:message", {
          sessionId,
          ...message
        });

        io.to("admin").emit("receive:message", {
          sessionId,
          ...message
        });
      } catch (err) {
        console.error("Error saving admin message:", err);
      }
    });

    socket.on("user:private-message", async ({ fromSessionId, toSessionId, content }) => {
      try {
        const fromUser = await findOrCreateUser(fromSessionId);

        const message = await saveMessage(
          fromUser.id,
          "user",
          content
        );

        io.to(toSessionId).emit("receive:private-message", {
          fromSessionId,
          toSessionId,
          ...message
        });

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
      connectedUsers = connectedUsers.filter(u => u !== socket.id);
      io.to("admin").emit("receive:users", connectedUsers);
    });
  });
};
