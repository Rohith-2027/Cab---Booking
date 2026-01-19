import pool from "../config/db.js";

export const getVendorDrivers = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT DISTINCT
        d.user_id AS driver_id,
        d.driver_name,
        d.phone_number,
        d.is_available,
        EXISTS (
          SELECT 1
          FROM driver_shifts s
          WHERE s.driver_id = d.user_id
            AND s.is_active = true
            AND NOW() BETWEEN s.shift_start AND s.shift_end
        ) AS in_active_shift
      FROM drivers d
      JOIN bookings b ON b.driver_id = d.user_id
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE v.vendor_id = $1
      ORDER BY d.driver_name
      `,
      [vendorId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Vendor drivers fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVendorPayments = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        b.id AS booking_id,
        b.pickup_location,
        b.drop_location,
        b.completed_at,
        b.payment_mode,
        p.status AS payment_status,
        p.amount,
        v.vehicle_type,
        v.plate_number,
        d.driver_name
      FROM bookings b
      JOIN payments p ON p.booking_id = b.id
      LEFT JOIN vehicles v ON v.id = b.vehicle_id
      LEFT JOIN drivers d ON d.user_id = b.driver_id
      WHERE b.vendor_id = $1
        AND p.status = 'paid'
      ORDER BY b.completed_at DESC
      `,
      [vendorId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Vendor payments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
