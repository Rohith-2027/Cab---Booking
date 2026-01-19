import { useEffect, useState } from "react";
import { getProfile } from "../api/profile";

export default function ProfileModal({ onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center">
      <div className="bg-white w-full max-w-sm p-6 rounded-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">Profile</h2>

        {loading && <p>Loading...</p>}

        {!loading && profile && (
          <div className="space-y-2">
            {profile.name && (
              <p><b>Name:</b> {profile.name}</p>
            )}

            <p><b>Email:</b> {profile.email}</p>
            <p><b>Role:</b> {profile.role}</p>

            <p className="break-all text-sm text-gray-500">
              <b>User ID:</b> {profile.id}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
