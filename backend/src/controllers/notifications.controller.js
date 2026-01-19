import pool from "../config/db.js";

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT id, message, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Notification fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};
