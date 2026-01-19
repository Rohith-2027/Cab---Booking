import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import { getUserNotifications } from "../controllers/notifications.controller.js";

const router = express.Router();

/* ================= USER NOTIFICATIONS ================= */

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["customer", "vendor", "driver"]),
  getUserNotifications
);

export default router;
