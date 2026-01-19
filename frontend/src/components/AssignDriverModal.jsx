import { useEffect, useState } from "react";
import {
  getAvailableDrivers,
  getAvailableVehicles,
  assignDriverAndVehicle,
} from "../api/vendorBookings";

export default function AssignDriverModal({ booking, onClose, onAssigned }) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const [dRes, vRes] = await Promise.all([
        getAvailableDrivers(),
        getAvailableVehicles(booking.requested_vehicle_type),
      ]);
      setDrivers(dRes.data);
      setVehicles(vRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!driverId || !vehicleId) return alert("Select driver & vehicle");

    await assignDriverAndVehicle(booking.id, {
      driver_id: driverId,
      vehicle_id: vehicleId,
    });

    onAssigned();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[400px] space-y-4">
        <h2 className="text-lg font-bold">Assign Driver & Vehicle</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <select
              className="w-full border p-2"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d.user_id} value={d.user_id}>
                  {d.name || d.user_id}
                </option>
              ))}
            </select>

            <select
              className="w-full border p-2"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number || v.id}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="border px-4 py-1">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="bg-indigo-600 text-white px-4 py-1"
              >
                Assign
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
