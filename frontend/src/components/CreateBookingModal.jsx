import { useState } from "react";
import { createBooking } from "../api/customerBookings";

export default function CreateBookingModal({ onClose, refreshBookings }) {
  const [form, setForm] = useState({
    pickup_location: "",
    drop_location: "",
    requested_vehicle_type: "",
    distance_km: "",
    target_pickup_time: "",
    payment_mode: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createBooking(form);
    refreshBookings();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-xl">
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          Create Booking
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="pickup_location" onChange={handleChange} className="w-full border px-4 py-2" placeholder="Pickup Location" />
          <input name="drop_location" onChange={handleChange} className="w-full border px-4 py-2" placeholder="Drop Location" />

          <select name="requested_vehicle_type" onChange={handleChange} className="w-full border px-4 py-2">
            <option value="">Select Vehicle</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="mini">Mini</option>
            <option value="luxury">Luxury</option>
          </select>

          <input name="distance_km" type="number" onChange={handleChange} className="w-full border px-4 py-2" placeholder="Distance (km)" />
          <input name="target_pickup_time" type="datetime-local" onChange={handleChange} className="w-full border px-4 py-2" />

          <div className="flex gap-6">
            <label><input type="radio" name="payment_mode" value="cash" onChange={handleChange} /> Cash</label>
            <label><input type="radio" name="payment_mode" value="online" onChange={handleChange} /> Online</label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="border px-4 py-2">
              Cancel
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
