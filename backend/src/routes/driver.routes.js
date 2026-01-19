import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import { getDriverBookings } from "../controllers/booking.controller.js";

import {
  setDriverAvailability,
  getDriverAvailability,
} from "../controllers/driver.controller.js";

import {
  createDriverShift,
  getDriverShifts,
  endDriverShift,
} from "../controllers/driverShift.controller.js";

const router = express.Router();

/* ================= DRIVER BOOKINGS ================= */

router.get(
  "/bookings",
  authMiddleware,
  roleMiddleware(["driver"]),
  getDriverBookings
);

/* ================= DRIVER AVAILABILITY ================= */

router.get(
  "/availability",
  authMiddleware,
  roleMiddleware(["driver"]),
  getDriverAvailability
);

router.patch(
  "/availability",
  authMiddleware,
  roleMiddleware(["driver"]),
  setDriverAvailability
);

/* ================= DRIVER SHIFTS ================= */

router.post(
  "/shifts",
  authMiddleware,
  roleMiddleware(["driver"]),
  createDriverShift
);

router.get(
  "/shifts",
  authMiddleware,
  roleMiddleware(["driver"]),
  getDriverShifts
);

router.patch(
  "/shifts/:shiftId/end",
  authMiddleware,
  roleMiddleware(["driver"]),
  endDriverShift
);

export default router;
