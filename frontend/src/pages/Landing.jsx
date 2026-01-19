import { useState } from "react";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

export default function Landing() {
  const [loginRole, setLoginRole] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative px-4">
      
      {/* Register Button */}
      <button
        onClick={() => setRegisterOpen(true)}
        className="absolute top-6 right-6 bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
      >
        Register
      </button>

      {/* Main Card */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Cab Booking System
        </h1>
        <p className="text-gray-500 mb-8">
          Login to continue
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setLoginRole("customer")}
            className="w-full py-3 rounded-lg border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-600 hover:text-white transition"
          >
            Customer Account Login
          </button>

          <button
            onClick={() => setLoginRole("vendor")}
            className="w-full py-3 rounded-lg border border-green-600 text-green-600 font-medium hover:bg-green-600 hover:text-white transition"
          >
            Vendor Account Login
          </button>

          <button
            onClick={() => setLoginRole("driver")}
            className="w-full py-3 rounded-lg border border-orange-500 text-orange-500 font-medium hover:bg-orange-500 hover:text-white transition"
          >
            Driver Account Login
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {loginRole && (
        <LoginModal
          key={loginRole} // important for re-render
          role={loginRole}
          onClose={() => setLoginRole(null)}
        />
      )}

      {/* Register Modal */}
      {registerOpen && (
        <RegisterModal onClose={() => setRegisterOpen(false)} />
      )}
    </div>
  );
}
