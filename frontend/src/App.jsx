import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Landing from "./pages/Landing";
import CustomerDashboard from "./pages/customer/Dashboard";
import VendorDashboard from "./pages/vendor/Dashboard";
import DriverDashboard from "./pages/driver/Dashboard";

import ResetPassword from "./pages/ResetPassword";


import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailure from "./pages/payment/PaymentFailure";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* TEMP DASHBOARD ROUTES */}
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />

          {/* SAFETY */}
          <Route path="*" element={<Navigate to="/" />} />

          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />


        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
