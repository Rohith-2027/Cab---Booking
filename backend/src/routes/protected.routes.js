import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import pool from "../config/db.js";

const router = express.Router();

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user;
    let result;

    if (role === "customer") {
      result = await pool.query(
        `
        SELECT 
          u.id,
          u.email,
          u.role,
          c.full_name AS name,
          c.phone_number
        FROM users u
        JOIN customers c ON c.user_id = u.id
        WHERE u.id = $1
        `,
        [userId]
      );
    }

    if (role === "driver") {
      result = await pool.query(
        `
        SELECT 
          u.id,
          u.email,
          u.role,
          d.driver_name AS name
        FROM users u
        JOIN drivers d ON d.user_id = u.id
        WHERE u.id = $1
        `,
        [userId]
      );
    }

    if (role === "vendor") {
      result = await pool.query(
        `
        SELECT 
          u.id,
          u.email,
          u.role,
          v.vendor_name AS name
        FROM users u
        JOIN vendors v ON v.user_id = u.id
        WHERE u.id = $1
        `,
        [userId]
      );
    }

    if (!result || !result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/whoami", authMiddleware, (req, res) => {
  res.json({
    userId: req.user.userId,
    role: req.user.role,
  });
});



export default router;
