import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = express.Router();

const ALLOWED_ROLES = ["customer", "vendor", "driver"];

/* =========================
   SIGNUP (REGISTER)
========================= */
router.post("/signup", async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required",
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `
      INSERT INTO users (email, password, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, role
      `,
      [email, hashedPassword, role]
    );

    const user = userResult.rows[0];

    if (role === "customer") {
      await client.query(
        `
        INSERT INTO customers (user_id, full_name, phone_number)
        VALUES ($1, $2, $3)
        `,
        [user.id, email.split("@")[0], `CUST-${Date.now()}`]
      );
    }

    if (role === "vendor") {
      await client.query(
        `
        INSERT INTO vendors (user_id, vendor_name, contact_number)
        VALUES ($1, $2, $3)
        `,
        [user.id, email.split("@")[0], `VEND-${Date.now()}`]
      );
    }

    if (role === "driver") {
      await client.query(
        `
        INSERT INTO drivers
        (user_id, driver_name, phone_number, license_number)
        VALUES ($1, $2, $3, $4)
        `,
        [
          user.id,
          email.split("@")[0],
          `DRV-${Date.now()}`,
          `LIC-${Date.now()}`,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Invalid login request",
      });
    }

    const result = await pool.query(
      `SELECT id, email, password, role FROM users WHERE email = $1 AND role = $2`,
      [email, role]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        message: "Invalid email, password, or role",
      });
    }


    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LOGOUT
========================= */
router.post("/logout", (req, res) => {
  res.json({
    message: "Logged out successfully. Delete token on client.",
  });
});

/* =========================
   FORGOT PASSWORD
========================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        message: "If the email exists, a reset link will be sent",
      });
    }

    const user = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (!user.rows.length) {
      return res.json({
        message: "If the email exists, a reset link will be sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `
      UPDATE users
      SET reset_token = $1, reset_token_expiry = $2
      WHERE email = $3
      `,
      [token, expiry, email]
    );

    console.log(
      `Reset link: http://localhost:3000/reset-password?token=${token}`
    );

    res.json({
      message: "If the email exists, a reset link will be sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset-password", async (req, res) => {
  const client = await pool.connect();
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    await client.query("BEGIN");

    const user = await client.query(
      `
      SELECT id
      FROM users
      WHERE reset_token = $1
        AND reset_token_expiry > NOW()
      FOR UPDATE
      `,
      [token]
    );

    if (!user.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await client.query(
      `
      UPDATE users
      SET password = $1,
          reset_token = NULL,
          reset_token_expiry = NULL
      WHERE reset_token = $2
      `,
      [hashed, token]
    );

    await client.query("COMMIT");

    res.json({ message: "Password reset successful" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

export default router;
