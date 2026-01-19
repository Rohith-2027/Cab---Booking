// src/pages/payment/PaymentSuccess.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const bookingId = params.get("bookingId");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        await api.post(`/payments/verify`, {
          booking_id: bookingId,
          status: "paid",
        });

        // redirect back to customer dashboard
        setTimeout(() => {
          navigate("/customer/dashboard");
        }, 6000);
      } catch (err) {
        console.error("Payment verification failed");
      }
    };

    if (bookingId) verifyPayment();
  }, [bookingId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded shadow text-center">
        <h1 className="text-2xl font-bold text-green-600">
          Payment Successful 🎉
        </h1>
        <p className="mt-2 text-gray-600">
          Your payment was completed successfully.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}
