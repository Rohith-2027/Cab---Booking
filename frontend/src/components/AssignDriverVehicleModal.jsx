import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AssignDriverVehicleModal({
  booking,
  onClose,
  refreshBookings,
}) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  const fetchDrivers = async () => {
    const res = await api.get("/vendor/drivers/available");
    setDrivers(res.data);
  };

  const fetchVehicles = async () => {
    const res = await api.get("/vendor/vehicles/available");
    setVehicles(res.data);
  };

  const handleAssign = async () => {
    if (!driverId || !vehicleId) return;

    await api.post(`/vendor/bookings/${booking.id}/assign`, {
      driver_id: driverId,
      vehicle_id: vehicleId,
    });

    onClose();
    refreshBookings();
  };

  return (
    /* 🔒 BACKDROP */
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      
      {/* 🧊 MODAL CARD */}
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Assign Driver & Vehicle
        </h2>

        {/* DRIVER */}
        <select
          className="w-full border px-3 py-2 rounded mb-3"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        >
          <option value="">Select Driver</option>
          {drivers.map((d) => (
            <option key={d.user_id} value={d.user_id}>
              {d.driver_name}
            </option>
          ))}
        </select>

        {/* VEHICLE */}
        <select
          className="w-full border px-3 py-2 rounded mb-4"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          <option value="">Select Vehicle</option>
          {vehicles.map((v) => (
            <option
              key={v.id}
              value={v.id}
              disabled={v.vehicle_type !== booking.requested_vehicle_type}
            >
              {v.vehicle_type.toUpperCase()} - {v.plate_number}
            </option>
          ))}
        </select>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="bg-indigo-600 text-white px-4 py-1 rounded"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
