import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import { getVendorDrivers,getVendorPayments } from "../controllers/vendor.controller.js";

const router = express.Router();

/* ================= VENDOR DASHBOARD ================= */

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["vendor"]),
  (req, res) => {
    res.json({
      message: "Vendor dashboard – Manage bookings, drivers, and vehicles",
    });
  }
);

/* ================= VENDOR DRIVERS ================= */

router.get(
  "/drivers",
  authMiddleware,
  roleMiddleware(["vendor"]),
  getVendorDrivers
);

router.get(
  "/payments",
  authMiddleware,
  roleMiddleware(["vendor"]),
  getVendorPayments
);

export default router;
