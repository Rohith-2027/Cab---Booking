import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import {
  initiatePhonePePayment,
  mockPhonePeSuccess,
  confirmCashPayment,
  verifyOnlinePayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

/* ================= ONLINE PAYMENT ================= */

router.post(
  "/payments/:bookingId/online/initiate",
  authMiddleware,
  roleMiddleware(["customer"]),
  initiatePhonePePayment
);

// ✅ MUST BE GET (browser redirect)
router.get("/payments/phonepe/mock-success", mockPhonePeSuccess);

router.post(
  "/payments/verify",
  authMiddleware,
  roleMiddleware(["customer"]),
  verifyOnlinePayment
);

/* ================= CASH PAYMENT ================= */

router.post(
  "/driver/payments/:bookingId/cash/confirm",
  authMiddleware,
  roleMiddleware(["driver"]),
  confirmCashPayment
);

export default router;
