import pool from "../config/db.js";

/**
 * Logs audit trail for booking state changes
 * - Safe to call inside or outside transactions
 * - Never throws error to calling code
 */
export const logAudit = async (
  client,
  bookingId,
  userId,
  role,
  oldStatus,
  newStatus
) => {
  await client.query(
    `
    INSERT INTO audit_logs
    (booking_id, changed_by, role, old_status, new_status)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [bookingId, userId, role, oldStatus, newStatus]
  );
};
