import cron from "node-cron";
import pool from "../config/db.js";

/**
 * Final Notification Job
 * ----------------------
 * Sends ONE final notification to customers
 * whose bookings were cancelled due to no vendor availability.
 */
cron.schedule("*/5 * * * *", async () => {
  const client = await pool.connect();

  try {
    console.log("Final expiry job running...");

    await client.query("BEGIN");

    // 🔒 Lock rows to avoid duplicate notifications
    const expired = await pool.query(`
      SELECT id, customer_id
      FROM bookings
      WHERE id IN (
        SELECT id
        FROM bookings
        WHERE status = 'cancelled'
          AND final_notification_sent = false
        FOR UPDATE SKIP LOCKED
      )
    `);

    for (const booking of expired.rows) {
      await client.query(
        `
        INSERT INTO notifications (user_id, message)
        VALUES ($1, $2)
        `,
        [
          booking.customer_id,
          "Sorry, no vendors were available for your booking request.",
        ]
      );

      await client.query(
        `
        UPDATE bookings
        SET final_notification_sent = true
        WHERE id = $1
        `,
        [booking.id]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Final expiry job error:", error);
  } finally {
    client.release();
  }
});
