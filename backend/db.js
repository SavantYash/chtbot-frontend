const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "chatbot",
  password: "Savant@2004",
  port: 5432
});

module.exports = pool;
