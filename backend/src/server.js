const http = require("http");
const { Server } = require("socket.io");
const app = require("..");
require("dotenv").config();

const server = http.createServer(app);

const PORT = process.env.PORT || 4000;



const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

require("./sockets/socket")(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});