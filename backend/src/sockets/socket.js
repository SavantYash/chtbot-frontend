const {
  findOrCreateUser,
  saveMessage
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

      io.to("admin").emit("receive:users", connectedUsers);
    });

    /* USER MESSAGE */
    socket.on("user:message", async ({ sessionId, content }) => {
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
    });

    /* ADMIN JOIN */
    socket.on("admin:join", () => {
      socket.join("admin");
      socket.emit("receive:users", connectedUsers);
    });

    /* ADMIN MESSAGE */
    socket.on("admin:message", async ({ sessionId, content }) => {
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
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });
};
