// src/pages/payment/PaymentFailure.jsx
import { useNavigate } from "react-router-dom";

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="bg-white p-8 rounded shadow text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Payment Failed ❌
        </h1>
        <p className="mt-2 text-gray-600">
          Your payment could not be completed.
        </p>

        <button
          onClick={() => navigate("/customer/dashboard")}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
        >
          Go Back to Dashboard
        </button>
      </div>
    </div>
  );
}
