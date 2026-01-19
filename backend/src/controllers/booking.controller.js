import pool from "../config/db.js";
import { logAudit } from "../utils/auditLogger.js";

/* ================= CUSTOMER ================= */

export const createBooking = async (req, res) => {
  try {
    const {
      pickup_location,
      drop_location,
      requested_vehicle_type,
      distance_km,
      target_pickup_time,
      payment_mode,
    } = req.body;

    const customerId = req.user.userId;

    if (
      !pickup_location ||
      !drop_location ||
      !requested_vehicle_type ||
      !distance_km ||
      !target_pickup_time ||
      !payment_mode
    ) {
      return res.status(400).json({ message: "All booking fields are required" });
    }

    if (!["mini", "sedan", "suv", "luxury"].includes(requested_vehicle_type)) {
      return res.status(400).json({ message: "Invalid vehicle type" });
    }

    if (!["cash", "online"].includes(payment_mode)) {
      return res.status(400).json({ message: "Invalid payment mode" });
    }

    if (Number(distance_km) <= 0) {
      return res.status(400).json({ message: "Invalid distance" });
    }

    const pickupTime = new Date(target_pickup_time);
    if (pickupTime <= new Date()) {
      return res
        .status(400)
        .json({ message: "Pickup time must be in the future" });
    }

    const booking = await pool.query(
      `
      INSERT INTO bookings
      (customer_id, pickup_location, drop_location, requested_vehicle_type,
       distance_km, target_pickup_time, payment_mode)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        customerId,
        pickup_location,
        drop_location,
        requested_vehicle_type,
        distance_km,
        target_pickup_time,
        payment_mode,
      ]
    );

    res.status(201).json({
      message: "Booking created successfully",
      booking: booking.rows[0],
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCustomerBookings = async (req, res) => {
  const result = await pool.query(
    `
    SELECT
      b.*,

      /* payment */
      p.status AS payment_status,

      /* driver */
      d.driver_name,

      /* vehicle */
      v.vehicle_type,
      v.plate_number,

      /* vendor */
      u.email AS vendor_email

    FROM bookings b

    LEFT JOIN payments p
      ON p.booking_id = b.id

    LEFT JOIN drivers d
      ON d.user_id = b.driver_id

    LEFT JOIN vehicles v
      ON v.id = b.vehicle_id

    LEFT JOIN users u
      ON u.id = b.vendor_id

    WHERE b.customer_id = $1
    ORDER BY b.created_at DESC
    `,
    [req.user.userId]
  );

  res.json(result.rows);
};

export const cancelBookingByCustomer = async (req, res) => {
  const client = await pool.connect();
  try {
    const bookingId = req.params.id;
    const customerId = req.user.userId;

    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT status FROM bookings
      WHERE id = $1 AND customer_id = $2
      FOR UPDATE
      `,
      [bookingId, customerId]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    if (result.rows[0].status !== "requested") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cannot cancel now" });
    }

    await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
      [bookingId]
    );

    await logAudit(
      client,
      bookingId,
      customerId,
      "customer",
      "requested",
      "cancelled"
    );

    await client.query("COMMIT");
    res.json({ message: "Booking cancelled" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* ================= VENDOR ================= */
export const getVendorBookings = async (req, res) => {
  console.log("VENDOR USER:", req.user);
  const vendorId = req.user.userId;

  const result = await pool.query(
    `
    SELECT b.*, p.status AS payment_status
    FROM bookings b
    LEFT JOIN payments p ON p.booking_id = b.id
    WHERE 
      (b.status = 'requested' AND b.vendor_id IS NULL)
      OR
      (b.vendor_id = $1 AND b.status IN ('accepted', 'assigned', 'started'))
    ORDER BY b.target_pickup_time ASC
    `,
    [vendorId]
  );

  const now = new Date();

  const enriched = result.rows.map((b) => ({
    ...b,
    priority:
      (new Date(b.target_pickup_time) - now) / (1000 * 60 * 60) <= 3
        ? "HIGH"
        : "NORMAL",
  }));

  res.json(enriched);
};

export const getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.pickup_location,
        b.drop_location,
        b.distance_km,
        b.target_pickup_time,
        b.completed_at,
        b.status,
        b.payment_mode,
        b.total_amount,

        p.amount,
        p.status AS payment_status,

        d.driver_name,

        v.vehicle_type,
        v.plate_number,

        u.email AS vendor_email

      FROM bookings b
      LEFT JOIN payments p
        ON p.booking_id = b.id
      LEFT JOIN drivers d
        ON d.user_id = b.driver_id
      LEFT JOIN vehicles v
        ON v.id = b.vehicle_id
      LEFT JOIN users u
        ON u.id = b.vendor_id

      WHERE b.id = $1
      `,
      [bookingId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ================= VENDOR – AVAILABLE RESOURCES =================

// GET /api/vendor/drivers/available
export const getAvailableDrivers = async (req, res) => {
  const vendorId = req.user.userId;

  const result = await pool.query(
    `
    SELECT user_id, driver_name
    FROM drivers
    WHERE vendor_id = $1
      AND is_available = true
    `,
    [vendorId]
  );

  res.json(result.rows);
};

// GET /api/vendor/vehicles/available
export const getAvailableVehicles = async (req, res) => {
  const vendorId = req.user.userId;

  const result = await pool.query(
    `
    SELECT id, vehicle_type, plate_number
    FROM vehicles
    WHERE vendor_id = $1
      AND is_available = true
    `,
    [vendorId]
  );

  res.json(result.rows);
};


export const acceptBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const bookingId = req.params.id;
    const vendorId = req.user.userId;

    await client.query("BEGIN");

    /* 1️⃣ Lock booking */
    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (!bookingRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    if (booking.status !== "requested") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Booking not in requestable state" });
    }

    /* 2️⃣ Find AVAILABLE vehicle owned by THIS vendor */
    const vehicleRes = await client.query(
      `
      SELECT id FROM vehicles
      WHERE vendor_id = $1
        AND vehicle_type = $2
        AND is_available = true
      LIMIT 1
      FOR UPDATE
      `,
      [vendorId, booking.requested_vehicle_type]
    );

    if (!vehicleRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No suitable vehicle available" });
    }

    const vehicleId = vehicleRes.rows[0].id;

    /* 3️⃣ Find AVAILABLE driver owned by THIS vendor */
    const driverRes = await client.query(
      `
      SELECT user_id FROM drivers
      WHERE vendor_id = $1
        AND is_available = true
      LIMIT 1
      FOR UPDATE
      `,
      [vendorId]
    );

    if (!driverRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No driver available" });
    }

    const driverId = driverRes.rows[0].user_id;

    /* 4️⃣ Fare calculation */
    const FARE = {
      mini: { base: 50, perKm: 10 },
      sedan: { base: 70, perKm: 14 },
      suv: { base: 90, perKm: 18 },
      luxury: { base: 150, perKm: 25 },
    };

    const fare =
      FARE[booking.requested_vehicle_type].base +
      booking.distance_km * FARE[booking.requested_vehicle_type].perKm;

    /* 5️⃣ Accept booking */
    await client.query(
      `
      UPDATE bookings
      SET status = 'accepted',
          vendor_id = $1,
          total_amount = $2
      WHERE id = $3
      `,
      [vendorId, fare, bookingId]
    );

    /* 6️⃣ Lock resources */
    // await client.query(
    //   `UPDATE vehicles SET is_available = false WHERE id = $1`,
    //   [vehicleId]
    // );

    // await client.query(
    //   `UPDATE drivers SET is_available = false WHERE user_id = $1`,
    //   [driverId]
    // );

    /* 7️⃣ Create payment record (ONLINE + CASH) */
    await client.query(
      `
      INSERT INTO payments (booking_id, method, amount, status)
      VALUES ($1, $2, $3, 'pending')
      ON CONFLICT (booking_id) DO NOTHING
      `,
      [bookingId, booking.payment_mode, fare]
    );


    /* 8️⃣ Notify customer */
    await client.query(
      `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
      `,
      [
        booking.customer_id,
        "Your booking has been accepted by a vendor",
      ]
    );

    await client.query("COMMIT");

    res.json({ message: "Booking accepted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Accept booking error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const assignDriverAndVehicle = async (req, res) => {
  const client = await pool.connect();
  try {
    const bookingId = req.params.id;
    const vendorId = req.user.userId;
    const { driver_id, vehicle_id } = req.body;

    if (!driver_id || !vehicle_id) {
      return res.status(400).json({
        message: "Driver and vehicle are required",
      });
    }

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `
      SELECT status, vendor_id
      FROM bookings
      WHERE id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    if (!bookingResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    if (booking.vendor_id !== vendorId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Unauthorized vendor" });
    }

    if (booking.status !== "accepted") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Booking not ready for assignment",
      });
    }

    const driverResult = await client.query(
      `
      SELECT is_available
      FROM drivers
      WHERE user_id = $1
      FOR UPDATE
      `,
      [driver_id]
    );

    if (!driverResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Driver not found" });
    }

    if (!driverResult.rows[0].is_available) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Driver is not available",
      });
    }

    const vehicleResult = await client.query(
      `
      SELECT is_available
      FROM vehicles
      WHERE id = $1 AND vendor_id = $2
      FOR UPDATE
      `,
      [vehicle_id, vendorId]
    );

    if (!vehicleResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Vehicle not found or unauthorized",
      });
    }

    if (!vehicleResult.rows[0].is_available) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Vehicle is not available",
      });
    }

    await client.query(
      `
      UPDATE bookings
      SET driver_id = $1,
          vehicle_id = $2,
          status = 'assigned'
      WHERE id = $3
      `,
      [driver_id, vehicle_id, bookingId]
    );

    await client.query(
      `UPDATE drivers SET is_available = false WHERE user_id = $1`,
      [driver_id]
    );

    await client.query(
      `UPDATE vehicles SET is_available = false WHERE id = $1`,
      [vehicle_id]
    );

    /* 🔔 DRIVER NOTIFICATION */
    /* 🔔 Notify Driver (SAFE VERSION) */
    const driverRow = await client.query(
      `
      SELECT driver_id
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    );

    if (driverRow.rows[0]?.driver_id) {
      await client.query(
        `
        INSERT INTO notifications (user_id, message)
        VALUES ($1, $2)
        `,
        [
          driverRow.rows[0].driver_id,
          "You have been assigned a new trip. Please start on time."
        ]
      );
    }


    await logAudit(
      client,
      bookingId,
      vendorId,
      "vendor",
      "accepted",
      "assigned"
    );

    await client.query("COMMIT");

    res.json({
      message: "Driver and vehicle assigned successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Assign driver error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


/* ================= DRIVER ================= */

export const startTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const bookingId = req.params.id;
    const driverId = req.user.userId;

    await client.query("BEGIN");

    const bookingRes = await client.query(
      `
      SELECT status, driver_id, payment_mode, customer_id
      FROM bookings
      WHERE id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    if (!bookingRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    if (booking.driver_id !== driverId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Not your trip" });
    }

    if (booking.payment_mode === "online") {
      const paymentRes = await client.query(
        `SELECT status FROM payments WHERE booking_id = $1`,
        [bookingId]
      );

      if (!paymentRes.rows.length || paymentRes.rows[0].status !== "paid") {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Payment not completed" });
      }
    }

    await client.query(
      `UPDATE bookings SET status = 'started' WHERE id = $1`,
      [bookingId]
    );

    /* 🔔 CUSTOMER NOTIFICATION */
    await client.query(
      `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
      `,
      [booking.customer_id, "Your trip has started."]
    );

    await logAudit(
      client,
      bookingId,
      driverId,
      "driver",
      "assigned",
      "started"
    );

    await client.query("COMMIT");
    res.json({ message: "Trip started" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const endTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const bookingId = req.params.id;
    const driverId = req.user.userId;

    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT driver_id, vehicle_id, payment_mode, customer_id
      FROM bookings
      WHERE id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result.rows[0];

    if (booking.driver_id !== driverId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Not your trip" });
    }

    await client.query(
      `
      UPDATE bookings
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = $1
      `,
      [bookingId]
    );

    await client.query(
      `UPDATE vehicles SET is_available = true WHERE id = $1`,
      [booking.vehicle_id]
    );

    await client.query(
      `UPDATE drivers SET is_available = true WHERE user_id = $1`,
      [driverId]
    );

    /* 🔔 CUSTOMER NOTIFICATION */
    await client.query(
      `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
      `,
      [
        booking.customer_id,
        booking.payment_mode === "cash"
          ? "Trip completed. Please pay cash to the driver."
          : "Trip completed successfully."
      ]
    );

    await logAudit(
      client,
      bookingId,
      driverId,
      "driver",
      "started",
      "completed"
    );

    await client.query("COMMIT");

    res.json({
      message:
        booking.payment_mode === "cash"
          ? "Trip completed. Confirm cash payment."
          : "Trip completed",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("End trip error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const getDriverBookings = async (req, res) => {
  try {
    const driverId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.pickup_location,
        b.drop_location,
        b.target_pickup_time,
        b.status,
        b.payment_mode,
        p.status AS payment_status,
        v.vehicle_type,
        v.plate_number
      FROM bookings b
      JOIN payments p ON p.booking_id = b.id
      LEFT JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.driver_id = $1
        AND (
          b.status != 'completed'
          OR (
            b.status = 'completed'
            AND b.payment_mode = 'cash'
            AND p.status != 'paid'
          )
        )
      ORDER BY b.target_pickup_time ASC
      `,
      [driverId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get driver bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getVendorBookingHistory = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.pickup_location,
        b.drop_location,
        b.target_pickup_time,
        b.completed_at,
        b.status,
        b.payment_mode,
        p.status AS payment_status,
        d.driver_name,
        v.plate_number,
        v.vehicle_type
      FROM bookings b
      LEFT JOIN payments p ON p.booking_id = b.id
      LEFT JOIN drivers d ON d.user_id = b.driver_id
      LEFT JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.vendor_id = $1
        AND b.status IN ('completed', 'cancelled')
      ORDER BY b.completed_at DESC NULLS LAST
      `,
      [vendorId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Vendor booking history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ================= DRIVER TRIP HISTORY =================
export const getDriverTripHistory = async (req, res) => {
  try {
    const driverId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.pickup_location,
        b.drop_location,
        b.target_pickup_time,
        b.completed_at,
        b.payment_mode,
        p.status AS payment_status,
        v.vehicle_type,
        v.plate_number
      FROM bookings b
      JOIN payments p ON p.booking_id = b.id
      LEFT JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.driver_id = $1
        AND b.status = 'completed'
        AND (
          b.payment_mode = 'online'
          OR (b.payment_mode = 'cash' AND p.status = 'paid')
        )
      ORDER BY b.completed_at DESC
      `,
      [driverId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Driver trip history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};




export const emergencyCancelBooking = async (req, res) => {
  const client = await pool.connect();
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;
    const { userId, role } = req.user;

    if (!reason) {
      return res.status(400).json({ message: "Reason required" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT status, customer_id, driver_id, vehicle_id
      FROM bookings
      WHERE id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result.rows[0];

    if (!["assigned", "started"].includes(booking.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Emergency cancellation not allowed in this state",
      });
    }

    await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
      [bookingId]
    );

    if (booking.driver_id) {
      await client.query(
        `UPDATE drivers SET is_available = true WHERE user_id = $1`,
        [booking.driver_id]
      );
    }

    if (booking.vehicle_id) {
      await client.query(
        `UPDATE vehicles SET is_available = true WHERE id = $1`,
        [booking.vehicle_id]
      );
    }

    await client.query(
      `
      INSERT INTO emergency_cancellations
      (booking_id, cancelled_by, role, reason)
      VALUES ($1, $2, $3, $4)
      `,
      [bookingId, userId, role, reason]
    );

    await client.query(
      `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, 'Booking cancelled due to emergency')
      `,
      [booking.customer_id]
    );

    await logAudit(
      client,
      bookingId,
      userId,
      role,
      booking.status,
      "cancelled"
    );

    await client.query("COMMIT");

    res.json({ message: "Booking cancelled due to emergency" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Emergency cancel error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
