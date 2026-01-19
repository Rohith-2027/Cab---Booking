import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ProfileModal from "../../components/ProfileModal";
import AssignDriverVehicleModal from "../../components/AssignDriverVehicleModal";
import BookingDetailsModal from "../../components/BookingDetailsModal";

import {
  getVendorBookings,
  acceptBooking,
} from "../../api/vendorBookings";

import { getVendorPayments } from "../../api/vendorPayments";

export default function VendorDashboard() {
  const { logout } = useAuth();

  /* ================= STATE ================= */

  const [showProfile, setShowProfile] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);

  const [assignBooking, setAssignBooking] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const [payments, setPayments] = useState({
    onlinePayments: [],
    cashPayments: [],
  });

  const [selectedBooking, setSelectedBooking] = useState(null);

  /* ================= EFFECT ================= */

  useEffect(() => {
    fetchVendorBookings();
    fetchAvailability();
    fetchVendorPayments();

    const interval = setInterval(() => {
      fetchVendorBookings();
      fetchAvailability();
      fetchVendorPayments();
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  /* ================= FETCH FUNCTIONS ================= */

  const fetchVendorBookings = async () => {
    try {
      setLoading(true);
      const res = await getVendorBookings();
      setBookings(res.data);
    } catch (err) {
      console.error("Vendor bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        api.get("/vendor/drivers/available"),
        api.get("/vendor/vehicles/available"),
      ]);

      setAvailableDrivers(driversRes.data);
      setAvailableVehicles(vehiclesRes.data);
    } catch (err) {
      console.error("Availability fetch failed", err);
    }
  };

  const fetchVendorPayments = async () => {
    try {
      const res = await getVendorPayments();

      setPayments({
        onlinePayments: res.data.filter(
          (p) => p.payment_mode === "online"
        ),
        cashPayments: res.data.filter(
          (p) => p.payment_mode === "cash"
        ),
      });
    } catch (err) {
      console.error("Vendor payments fetch error:", err);
    }
  };

  /* ================= ACTIONS ================= */

  const handleAccept = async (bookingId) => {
    try {
      setAcceptingId(bookingId);
      await acceptBooking(bookingId);
      fetchVendorBookings();
      fetchAvailability();
    } catch (err) {
      console.error("Accept booking failed:", err);
    } finally {
      setAcceptingId(null);
    }
  };

  /* ================= HELPERS ================= */

  const getStatusUI = (status) => {
    switch (status) {
      case "requested":
        return { text: "Requested", color: "text-yellow-600" };
      case "accepted":
        return { text: "Accepted", color: "text-blue-600" };
      case "assigned":
        return { text: "Assigned", color: "text-purple-600" };
      case "started":
        return { text: "Trip Started", color: "text-indigo-600" };
      default:
        return { text: status, color: "text-gray-600" };
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-200">
      {/* ================= HEADER ================= */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-600">
          Vendor Dashboard
        </h1>

        <div className="flex items-center gap-4">
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

      {/* ================= CONTENT ================= */}
      <main className="p-6 space-y-10">

        {/* ================= INCOMING & ACTIVE BOOKINGS ================= */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Incoming & Active Bookings
          </h2>

          {loading && <p>Loading bookings...</p>}

          {!loading && bookings.length === 0 && (
            <p className="text-gray-500">
              No booking requests available.
            </p>
          )}

          {!loading &&
            bookings.map((b) => {
              const statusUI = getStatusUI(b.status);
              const hasDriver = availableDrivers.length > 0;
              const hasVehicle = availableVehicles.some(
                (v) => v.vehicle_type === b.requested_vehicle_type
              );

              return (
                <div
                  key={b.id}
                  className="bg-white p-6 rounded shadow flex justify-between"
                >
                  {/* LEFT */}
                  <div>
                    <p><b>Pickup:</b> {b.pickup_location}</p>
                    <p><b>Drop:</b> {b.drop_location}</p>
                    <p><b>Payment:</b> {b.payment_mode}</p>
                    <p><b>Vehicle:</b> {b.requested_vehicle_type}</p>
                    <p>
                      <b>Pickup Time:</b>{" "}
                      {new Date(b.target_pickup_time).toLocaleString()}
                    </p>

                    <hr className="my-2" />

                    <p>
                      <b>Drivers:</b>{" "}
                      <span className={hasDriver ? "text-green-600" : "text-red-600"}>
                        {hasDriver ? "Available" : "Unavailable"}
                      </span>
                    </p>

                    <p>
                      <b>Vehicles:</b>{" "}
                      <span className={hasVehicle ? "text-green-600" : "text-red-600"}>
                        {hasVehicle ? "Available" : "Unavailable"}
                      </span>
                    </p>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right space-y-2">
                    <p className={`font-semibold ${statusUI.color}`}>
                      Status: {statusUI.text}
                    </p>

                    {b.status === "requested" && (
                      <button
                        disabled={!hasDriver || !hasVehicle || acceptingId === b.id}
                        onClick={() => handleAccept(b.id)}
                        className={`px-4 py-1 rounded text-white ${
                          hasDriver && hasVehicle
                            ? "bg-green-600"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {acceptingId === b.id ? "Accepting..." : "Accept Booking"}
                      </button>
                    )}

                    {b.status === "accepted" && (
                      <button
                        onClick={() => setAssignBooking(b)}
                        className="bg-indigo-600 text-white px-4 py-1 rounded"
                      >
                        Assign Driver & Vehicle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </section>

        {/* ================= ONLINE PAYMENTS ================= */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Online Payments</h2>

          {payments.onlinePayments.length === 0 && (
            <p className="text-gray-500">No online payments</p>
          )}

          {payments.onlinePayments.map((p) => (
            <div
              key={p.booking_id}
              onClick={() => setSelectedBooking(p.booking_id)}
              className="bg-white p-4 rounded shadow flex justify-between cursor-pointer hover:ring-2 hover:ring-indigo-400"
            >
              <p><b>Booking ID:</b> {p.booking_id}</p>
              <p className="text-green-600 font-semibold">Paid</p>
            </div>
          ))}
        </section>

        {/* ================= CASH PAYMENTS ================= */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Cash Payments</h2>

          {payments.cashPayments.length === 0 && (
            <p className="text-gray-500">No cash payments</p>
          )}

          {payments.cashPayments.map((p) => (
            <div
              key={p.booking_id}
              onClick={() => setSelectedBooking(p.booking_id)}
              className="bg-white p-4 rounded shadow flex justify-between cursor-pointer hover:ring-2 hover:ring-yellow-400"
            >
              <div>
                <p><b>Booking ID:</b> {p.booking_id}</p>
                <p><b>Driver:</b> {p.driver_name || p.driver_id}</p>
              </div>

              <p className="text-green-600 font-semibold">
                Cash Collected
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* ================= MODALS ================= */}

      {assignBooking && (
        <AssignDriverVehicleModal
          booking={assignBooking}
          onClose={() => setAssignBooking(null)}
          refreshBookings={fetchVendorBookings}
        />
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {selectedBooking && (
        <BookingDetailsModal
          bookingId={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
