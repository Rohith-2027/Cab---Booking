import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
});

// 🔌 Log successful connection
pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

// ❌ Handle unexpected errors
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error", err);
  process.exit(1);
});

// 🧪 Optional test connection (safe)
(async () => {
  try {
    const client = await pool.connect();
    client.release();
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
})();

export default pool;
