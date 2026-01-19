import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import CreateBookingModal from "../../components/CreateBookingModal";
import NotificationsModal from "../../components/NotificationsModal";
import ProfileModal from "../../components/ProfileModal";
import BookingDetailsModal from "../../components/BookingDetailsModal";

import {
  getMyBookings,
  cancelBooking,
  initiateOnlinePayment,
} from "../../api/customerBookings";

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedBooking, setSelectedBooking] =   useState(null);

  useEffect(() => {
    fetchBookings();

    const interval = setInterval(() => {
      fetchBookings();
    }, 5000); // every 5 sec

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    document.body.style.overflow = showCreate ? "hidden" : "auto";
  }, [showCreate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getMyBookings();
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    await cancelBooking(id);
    fetchBookings();
  };

  const handlePayment = async (id) => {
    const res = await initiateOnlinePayment(id);
    window.location.href = res.data.payment_url; // PhonePe redirect
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "requested":
        return { text: "Requested", color: "text-yellow-600" };
      case "accepted":
        return { text: "Accepted", color: "text-blue-600" };
      case "cancelled":
        return { text: "Cancelled", color: "text-red-600" };
      case "started":
        return { text: "Trip Started", color: "text-purple-600" };
      case "completed":
        return { text: "Trip Completed", color: "text-green-600" };
      case "expired":
        return { text: "Expired", color: "text-gray-500" };
      default:
        return { text: status, color: "text-gray-500" };
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-200">
        {/* Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            Customer Dashboard
          </h1>

          <div className="flex items-center gap-4">
            <button
              className="text-xl"
              onClick={() => setShowNotifications(true)}
            >
              🔔
            </button>

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
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">View Your Bookings</h2>

            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Create New Booking
            </button>
          </div>

          {loading && <p>Loading bookings...</p>}

          {!loading &&
            bookings.map((b) => {
              const statusUI = getStatusLabel(b.status);

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="bg-white p-6 rounded shadow flex justify-between cursor-pointer hover:ring-2 hover:ring-indigo-400"
                >

                  {/* Left */}
                  <div>
                    <p><b>Pickup:</b> {b.pickup_location}</p>
                    <p><b>Drop:</b> {b.drop_location}</p>
                    <p><b>Distance:</b> {b.distance_km} km</p>
                    <p>
                      <b>Pickup Time:</b>{" "}
                      {new Date(b.target_pickup_time).toLocaleString()}
                    </p>
                    <p><b>Payment:</b> {b.payment_mode}</p>
                  </div>

                  {/* Right */}
                  <div className="text-right space-y-2">
                    <p className={`font-semibold ${statusUI.color}`}>
                      Status: {statusUI.text}
                    </p>

                    {/* Waiting info */}
                    {b.status === "requested" && (
                      <p className="text-sm text-gray-500">
                        Waiting for a vendor to accept your booking
                      </p>
                    )}

                    {/* Cancel allowed only before acceptance */}
                    {b.status === "requested" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();   // ✅ PREVENT CARD CLICK
                          handleCancel(b.id);
                        }}
                        className="border px-3 py-1"
                      >
                        Cancel
                      </button>

                    )}

                    {/* Online payment */}
                    {["accepted", "assigned"].includes(b.status) &&
                      b.payment_mode === "online" &&
                      b.payment_status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 🔥 VERY IMPORTANT
                            handlePayment(b.id);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Pay Now
                        </button>
                    )}

                    {/* Cash payment info */}
                    {b.status === "accepted" && b.payment_mode === "cash" && (
                      <p className="text-gray-600 italic">
                        Payment to be collected by driver
                      </p>
                    )}

                    {/* Paid */}
                    {b.payment_status === "paid" && (
                      <p className="text-green-600 font-semibold">
                        Payment Completed
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

        </main>
      </div>

      {showCreate && (
        <CreateBookingModal
          onClose={() => setShowCreate(false)}
          refreshBookings={fetchBookings}
        />
      )}

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}


    </>
  );
}
