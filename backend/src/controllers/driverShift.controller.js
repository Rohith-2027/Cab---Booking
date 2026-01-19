import pool from "../config/db.js";

/* ================= CREATE DRIVER SHIFT ================= */

export const createDriverShift = async (req, res) => {
  const client = await pool.connect();
  try {
    const driverId = req.user.userId;
    const { shift_start, shift_end } = req.body;

    if (!shift_start || !shift_end) {
      return res.status(400).json({
        message: "Shift start and end required",
      });
    }

    const start = new Date(shift_start);
    const end = new Date(shift_end);

    if (start >= end) {
      return res.status(400).json({
        message: "Invalid shift timing",
      });
    }

    await client.query("BEGIN");

    // 🔒 Prevent overlapping shifts (past, present, future)
    const overlap = await client.query(
      `
      SELECT 1
      FROM driver_shifts
      WHERE driver_id = $1
        AND shift_start < $3
        AND shift_end > $2
      FOR UPDATE
      `,
      [driverId, start, end]
    );

    if (overlap.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Shift overlaps with existing shift",
      });
    }

    await client.query(
      `
      INSERT INTO driver_shifts (driver_id, shift_start, shift_end, is_active)
      VALUES ($1, $2, $3, true)
      `,
      [driverId, start, end]
    );

    await client.query("COMMIT");

    res.json({ message: "Shift created successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create shift error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* ================= GET DRIVER SHIFTS ================= */

export const getDriverShifts = async (req, res) => {
  try {
    const driverId = req.user.userId;

    const result = await pool.query(
      `
      SELECT id, shift_start, shift_end, is_active
      FROM driver_shifts
      WHERE driver_id = $1
      ORDER BY shift_start DESC
      `,
      [driverId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch shifts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= END DRIVER SHIFT ================= */

export const endDriverShift = async (req, res) => {
  const client = await pool.connect();
  try {
    const shiftId = req.params.shiftId;
    const driverId = req.user.userId;

    await client.query("BEGIN");

    // 🚫 Prevent ending shift during active trip
    const activeTrip = await client.query(
      `
      SELECT 1
      FROM bookings
      WHERE driver_id = $1
        AND status IN ('assigned', 'ongoing')
      FOR UPDATE
      `,
      [driverId]
    );

    if (activeTrip.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Cannot end shift during active trip",
      });
    }

    const result = await client.query(
      `
      UPDATE driver_shifts
      SET is_active = false
      WHERE id = $1 AND driver_id = $2
      RETURNING id
      `,
      [shiftId, driverId]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Shift not found",
      });
    }

    // 🔻 Driver goes unavailable when shift ends
    await client.query(
      `
      UPDATE drivers
      SET is_available = false
      WHERE user_id = $1
      `,
      [driverId]
    );

    await client.query("COMMIT");

    res.json({ message: "Shift ended successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("End shift error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
