const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const setupSocket = require("./socketHandler");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

setupSocket(io);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
