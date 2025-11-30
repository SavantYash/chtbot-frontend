const express = require("express");
const cors = require("cors");
const chatRoutes = require("./src/routes/chat_routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", chatRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
