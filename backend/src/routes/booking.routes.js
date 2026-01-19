import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import {
  createBooking,
  getCustomerBookings,
  cancelBookingByCustomer,
  getVendorBookings,
  getBookingDetails,
  getAvailableDrivers,
  getAvailableVehicles,
  acceptBooking,
  assignDriverAndVehicle,
  getVendorBookingHistory,
  startTrip,
  endTrip,
  getDriverBookings,
  getDriverTripHistory,
  emergencyCancelBooking,
} from "../controllers/booking.controller.js";

const router = express.Router();

/* ================= CUSTOMER ================= */

router.post(
  "/bookings",
  authMiddleware,
  roleMiddleware(["customer"]),
  createBooking
);

router.get(
  "/bookings/my",
  authMiddleware,
  roleMiddleware(["customer"]),
  getCustomerBookings
);

router.patch(
  "/bookings/:id/cancel",
  authMiddleware,
  roleMiddleware(["customer"]),
  cancelBookingByCustomer
);

/* ================= VENDOR ================= */

router.get(
  "/vendor/bookings",
  authMiddleware,
  roleMiddleware(["vendor"]),
  getVendorBookings
);

router.get(
  "/vendor/drivers/available",
  authMiddleware,
  roleMiddleware(["vendor"]),
  getAvailableDrivers
);

router.get(
  "/vendor/vehicles/available",
  authMiddleware,
  roleMiddleware(["vendor"]),
  getAvailableVehicles
);


router.post(
  "/vendor/bookings/:id/accept",
  authMiddleware,
  roleMiddleware(["vendor"]),
  acceptBooking
);

router.post(
  "/vendor/bookings/:id/assign",
  authMiddleware,
  roleMiddleware(["vendor"]),
  assignDriverAndVehicle
);

router.get(
  "/vendor/bookings/history",
  authMiddleware,
  roleMiddleware(["vendor"]),
  getVendorBookingHistory
);

router.get(
  "/bookings/:id/details",
  authMiddleware,
  getBookingDetails
);


/* ================= DRIVER ================= */

router.get(
  "/driver/bookings",
  authMiddleware,
  roleMiddleware(["driver"]),
  getDriverBookings
);

router.post(
  "/driver/bookings/:id/start",
  authMiddleware,
  roleMiddleware(["driver"]),
  startTrip
);

router.post(
  "/driver/bookings/:id/end",
  authMiddleware,
  roleMiddleware(["driver"]),
  endTrip
);

router.get(
  "/driver/bookings/history",
  authMiddleware,
  roleMiddleware(["driver"]),
  getDriverTripHistory
);


/* ================= EMERGENCY (ALL ROLES) ================= */

router.patch(
  "/bookings/:id/emergency-cancel",
  authMiddleware,
  roleMiddleware(["customer", "vendor", "driver"]),
  emergencyCancelBooking
);

export default router;
