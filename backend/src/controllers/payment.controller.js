import pool from "../config/db.js";
import { logAudit } from "../utils/auditLogger.js";

/* ================= CASH PAYMENT CONFIRM ================= */
export const confirmCashPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const bookingId = req.params.bookingId;
    const driverId = req.user.userId;

    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT
        b.driver_id,
        b.status,
        b.payment_mode,
        b.customer_id,
        p.id AS payment_id,
        p.status AS payment_status
      FROM bookings b
      JOIN payments p ON p.booking_id = b.id
      WHERE b.id = $1
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
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.payment_mode !== "cash") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Not a cash payment" });
    }

    if (booking.status !== "completed") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Trip must be completed first",
      });
    }

    if (booking.payment_status === "paid") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Payment already confirmed",
      });
    }

    await client.query(
      `
      UPDATE payments
      SET status = 'paid',
          verified = true
      WHERE id = $1
      `,
      [booking.payment_id]
    );

    /* 🔔 CUSTOMER NOTIFICATION */
    await client.query(
      `
      INSERT INTO notifications (user_id, message)
      VALUES ($1, $2)
      `,
      [booking.customer_id, "Cash payment has been confirmed by the driver."]
    );

    await logAudit(
      client,
      bookingId,
      driverId,
      "driver",
      "completed",
      "paid"
    );

    await client.query("COMMIT");

    res.json({
      message: "Cash payment confirmed successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Cash payment confirmation error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


/* ================= PHONEPE INITIATE ================= */

export const initiatePhonePePayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user.userId;

    const booking = await pool.query(
      `
      SELECT customer_id, status, payment_mode, total_amount
      FROM bookings
      WHERE id = $1
      `,
      [bookingId]
    );

    if (!booking.rows.length)
      return res.status(404).json({ message: "Booking not found" });

    const b = booking.rows[0];

    if (b.customer_id !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    if (b.payment_mode !== "online")
      return res.status(400).json({ message: "Not an online payment" });

    if (!["accepted", "assigned"].includes(b.status))
      return res.status(400).json({ message: "Invalid booking state" });

    await pool.query(
      `
      INSERT INTO payments (booking_id, method, amount, status)
      VALUES ($1, 'online', $2, 'pending')
      ON CONFLICT (booking_id) DO NOTHING
      `,
      [bookingId, b.total_amount]
    );

    res.json({
      payment_url: `http://localhost:5000/api/payments/phonepe/mock-success?bookingId=${bookingId}`,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= PHONEPE MOCK SUCCESS ================= */

export const mockPhonePeSuccess = async (req, res) => {
  const client = await pool.connect();
  try {
    const bookingId = req.query.bookingId;

    if (!bookingId) {
      return res.status(400).json({ message: "Missing bookingId" });
    }

    await client.query("BEGIN");

    const payment = await client.query(
      `
      SELECT p.id, p.status, b.customer_id, b.payment_mode
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE p.booking_id = $1
      FOR UPDATE
      `,
      [bookingId]
    );

    if (!payment.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }

    const p = payment.rows[0];

    if (p.payment_mode !== "online") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid payment mode" });
    }

    if (p.status === "paid") {
      await client.query("ROLLBACK");
      res.redirect(
        `http://localhost:5173/payment/success?bookingId=${bookingId}`
      );

    }

    await client.query(
      `UPDATE payments SET status = 'paid', verified = true WHERE id = $1`,
      [p.id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, 'Payment successful. You can start the trip now.')`,
      [p.customer_id]
    );

    await logAudit(client, bookingId, p.customer_id, "customer", "pending", "paid");

    await client.query("COMMIT");

    res.redirect(
      `http://localhost:5173/payment/success?bookingId=${bookingId}`
    );

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* ================= VERIFY ONLINE PAYMENT ================= */

export const verifyOnlinePayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { booking_id } = req.body;
    const userId = req.user.userId;

    await client.query("BEGIN");

    const paymentRes = await client.query(
      `
      SELECT p.id, p.status, b.customer_id
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE p.booking_id = $1
      FOR UPDATE
      `,
      [booking_id]
    );

    if (!paymentRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = paymentRes.rows[0];

    if (payment.customer_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (payment.status === "paid") {
      await client.query("ROLLBACK");
      return res.json({ message: "Already verified" });
    }

    await client.query(
      `UPDATE payments SET status='paid', verified=true WHERE id=$1`,
      [payment.id]
    );

    await client.query("COMMIT");
    res.json({ message: "Payment verified successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
