import { useState } from "react";
import api from "../api/axios";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function LoginModal({ role, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/login", {
        email,
        password,
        role, // ✅ SEND EXPECTED ROLE TO BACKEND
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);

      window.location.href = `/${user.role}/dashboard`;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };



  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 capitalize">
          {role} Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border px-4 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border px-4 py-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Login
          </button>
        </form>

        <p
          onClick={() => setForgotOpen(true)}
          className="text-center text-sm mt-4 text-indigo-600 cursor-pointer"
        >
          Forgot password?
        </p>

        {forgotOpen && (
          <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
        )}

      </div>
    </div>
  );
}
