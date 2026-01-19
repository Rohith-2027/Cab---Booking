import { useEffect, useState } from "react";
import api from "../api/axios";
import BookingTimeline from "./BookingTimeline";

export default function BookingDetailsModal({ bookingId, onClose }) {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const res = await api.get(`/bookings/${bookingId}/details`);
      setBooking(res.data);
    };
    fetchDetails();
  }, [bookingId]);

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-xl">✕</button>

        <h2 className="text-xl font-bold mb-4">Booking Details</h2>

        <div className="space-y-2 text-sm">
          {booking.completed_at && (
            <p><b>Completed At:</b> {new Date(booking.completed_at).toLocaleString()}</p>
          )}

          <p><b>Pickup:</b> {booking.pickup_location}</p>
          <p><b>Drop:</b> {booking.drop_location}</p>
          <p><b>Distance:</b> {booking.distance_km} km</p>
          <p><b>Pickup Time:</b> {new Date(booking.target_pickup_time).toLocaleString()}</p>
          <p><b>Payment Mode:</b> {booking.payment_mode}</p>
          <p><b>Status:</b> {booking.status}</p>

          <hr className="my-3" />
          <BookingTimeline status={booking.status} />
          <hr className="my-3" />

          <p><b>Vendor:</b> {booking.vendor_email || "Not assigned yet"}</p>
          <p><b>Driver:</b> {booking.driver_name || "Not assigned yet"}</p>
          <p>
            <b>Vehicle:</b>{" "}
            {booking.vehicle_type && booking.plate_number
              ? `${booking.vehicle_type.toUpperCase()} - ${booking.plate_number}`
              : "Not assigned yet"}
          </p>

          <p className="font-semibold text-green-600">
            <b>Amount:</b> ₹{booking.amount || booking.total_amount}
          </p>

          {booking.payment_status && (
            <p className="font-semibold text-green-600">
              Payment Status: {booking.payment_mode === "cash" ? "Cash Collected" : "Paid Online"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
