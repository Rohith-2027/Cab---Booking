import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ProfileModal from "../../components/ProfileModal";
import NotificationsModal from "../../components/NotificationsModal";

import {
  getDriverBookings,
  startTrip,
  endTrip,
  confirmCashPayment,
  getDriverTripHistory,
} from "../../api/driverBookings";

export default function DriverDashboard() {
  const { logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  /* ================= FETCH FUNCTIONS ================= */

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getDriverBookings();
      setBookings(res.data);
    } catch (err) {
      console.error("Driver bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripHistory = async () => {
    try {
      const res = await getDriverTripHistory();
      setHistory(res.data);
    } catch (err) {
      console.error("Trip history error:", err);
    }
  };

  /* ================= EFFECT ================= */

  useEffect(() => {
    fetchBookings();
    fetchTripHistory();

    const interval = setInterval(() => {
      fetchBookings();
      fetchTripHistory();
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  /* ================= HANDLERS ================= */

  const handleStartTrip = async (id) => {
    await startTrip(id);
    fetchBookings();
  };

  const handleEndTrip = async (id) => {
    await endTrip(id);
    fetchBookings();
    fetchTripHistory();
  };

  const handleCashConfirm = async (id) => {
    await confirmCashPayment(id);
      fetchBookings();
      fetchTripHistory();
  };

  /* ================= HELPERS ================= */

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "text-blue-600";
      case "started":
        return "text-indigo-600";
      case "completed":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">
          Driver Dashboard
        </h1>

        <div className="flex items-center gap-4">
          {/* 🔔 Notifications */}
          <button
            className="text-xl"
            onClick={() => setShowNotifications(true)}
          >
            🔔
          </button>

          {/* 👤 Profile */}
          <button
            className="text-xl"
            onClick={() => setShowProfile(true)}
          >
            👤
          </button>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-1 rounded"
          >
            Logout
          </button>
        </div>

      </header>

      {/* Content */}
      <main className="p-6 space-y-8">
        {/* ================= ACTIVE TRIPS ================= */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">My Trips</h2>

          {loading && <p>Loading trips...</p>}

          {!loading && bookings.length === 0 && (
            <p className="text-gray-500">No assigned trips</p>
          )}

          {!loading &&
            bookings
              .filter(
                b =>
                  !(b.status === "completed" && b.payment_status === "paid")
              )
              .map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-6 rounded shadow flex justify-between"
                >
                  {/* Left */}
                  <div>
                    <p><b>Pickup:</b> {b.pickup_location}</p>
                    <p><b>Drop:</b> {b.drop_location}</p>
                    <p>
                      <b>Pickup Time:</b>{" "}
                      {new Date(b.target_pickup_time).toLocaleString()}
                    </p>
                    <p><b>Payment Mode:</b> {b.payment_mode}</p>
                    <p><b>Vehicle Type:</b> {b.vehicle_type}</p>
                    <p><b>Plate Number:</b> {b.plate_number}</p>

                    {b.payment_mode === "online" && (
                      <p>
                        <b>Payment Status:</b>{" "}
                        <span
                          className={
                            b.payment_status === "paid"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {b.payment_status}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Right */}
                  <div className="text-right space-y-2">
                    <p className={`font-semibold ${getStatusColor(b.status)}`}>
                      Status: {b.status}
                    </p>

                    {b.status === "assigned" && (
                      <button
                        onClick={() => handleStartTrip(b.id)}
                        className="bg-green-600 text-white px-4 py-1 rounded"
                      >
                        Start Trip
                      </button>
                    )}

                    {b.status === "started" && (
                      <button
                        onClick={() => handleEndTrip(b.id)}
                        className="bg-indigo-600 text-white px-4 py-1 rounded"
                      >
                        End Trip
                      </button>
                    )}

                    {b.status === "completed" &&
                      b.payment_mode === "cash" &&
                      b.payment_status !== "paid" && (
                        <button
                          onClick={() => handleCashConfirm(b.id)}
                          className="bg-yellow-600 text-white px-4 py-1 rounded"
                        >
                          Confirm Cash Payment
                        </button>
                    )}

                    {b.payment_status === "paid" && (
                      <p className="text-green-600 font-semibold">
                        Payment Completed
                      </p>
                    )}
                  </div>
                </div>
              ))}
        </section>

        {/* ================= TRIP HISTORY ================= */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Trip History</h2>

          {history.length === 0 && (
            <p className="text-gray-500">No completed trips yet</p>
          )}

          {history.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded shadow flex justify-between"
            >
              <div>
                <p><b>Pickup:</b> {b.pickup_location}</p>
                <p><b>Drop:</b> {b.drop_location}</p>
                <p>
                  <b>Pickup Time:</b>{" "}
                  {new Date(b.target_pickup_time).toLocaleString()}
                </p>
                <p>
                  <b>Completed At:</b>{" "}
                  {new Date(b.completed_at).toLocaleString()}
                </p>
                <p><b>Payment Mode:</b> {b.payment_mode}</p>
                <p><b>Vehicle Type:</b> {b.vehicle_type}</p>
                <p><b>Plate Number:</b> {b.plate_number}</p>
              </div>

              <div className="text-right">
                <p className="text-green-600 font-semibold">Completed</p>
                {b.payment_status === "paid" && (
                  <p className="text-green-600">Payment Completed</p>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Profile */}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
      {showNotifications && (
        <NotificationsModal
          onClose={() => setShowNotifications(false)}
        />
      )}

    </div>
  );
}
