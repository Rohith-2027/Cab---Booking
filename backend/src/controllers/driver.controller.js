import pool from "../config/db.js";

/* ================= SET DRIVER AVAILABILITY ================= */

export const setDriverAvailability = async (req, res) => {
  const client = await pool.connect();
  try {
    const driverId = req.user.userId;
    const { is_available } = req.body;

    if (typeof is_available !== "boolean") {
      return res.status(400).json({
        message: "is_available must be boolean",
      });
    }

    await client.query("BEGIN");

    // 1️⃣ Check active trip
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
        message: "Cannot change availability during active trip",
      });
    }

    // 2️⃣ Check active shift (only when going available)
    if (is_available) {
      const shiftCheck = await client.query(
        `
        SELECT 1
        FROM driver_shifts
        WHERE driver_id = $1
          AND is_active = true
          AND NOW() BETWEEN shift_start AND shift_end
        `,
        [driverId]
      );

      if (!shiftCheck.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Cannot go available outside active shift",
        });
      }
    }

    // 3️⃣ Update availability
    await client.query(
      `
      UPDATE drivers
      SET is_available = $1
      WHERE user_id = $2
      `,
      [is_available, driverId]
    );

    await client.query("COMMIT");

    res.json({
      message: `Driver availability set to ${is_available}`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Driver availability error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* ================= GET DRIVER AVAILABILITY ================= */

export const getDriverAvailability = async (req, res) => {
  try {
    const driverId = req.user.userId;

    const result = await pool.query(
      `
      SELECT is_available
      FROM drivers
      WHERE user_id = $1
      `,
      [driverId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch driver availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
