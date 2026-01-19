import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import bookingRoutes from "./routes/booking.routes.js"; 
import notificationRoutes from "./routes/notification.routes.js";

import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api", driverRoutes);
app.use("/api", bookingRoutes); 
app.use("/api/notifications", notificationRoutes);
app.use("/api", paymentRoutes);


app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});


// Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
