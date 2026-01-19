import cron from "node-cron";
import pool from "../config/db.js";

cron.schedule("*/10 * * * *", async () => {
  await pool.query(
    `
    UPDATE driver_shifts
    SET is_active = false
    WHERE is_active = true
      AND shift_end < NOW()
    `
  );
});
