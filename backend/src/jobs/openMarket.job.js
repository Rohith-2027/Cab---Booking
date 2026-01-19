export default async function openMarketJob() {
  const now = new Date();

  await pool.query(
    `
    UPDATE bookings
    SET status = 'rejected'
    WHERE status = 'requested'
      AND target_pickup_time - INTERVAL '1 hour' <= $1
    `,
    [now]
  );

  await pool.query(
    `
    INSERT INTO notifications (user_id, message)
    SELECT customer_id,
           'Booking rejected: No vehicle available'
    FROM bookings
    WHERE status = 'rejected'
    `
  );
}
