import { useEffect, useState } from "react";
import { getMyNotifications } from "../api/notifications";

export default function NotificationsModal({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getMyNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center">
      <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">Notifications</h2>

        {loading && <p>Loading...</p>}

        {!loading && notifications.length === 0 && (
          <p className="text-gray-500">No notifications</p>
        )}

        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className="border p-3 rounded">
              <p>{n.message}</p>
              <small className="text-gray-500">
                {new Date(n.created_at).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
