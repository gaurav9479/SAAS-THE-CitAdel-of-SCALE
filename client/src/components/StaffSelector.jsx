import { useEffect, useState } from "react";
import api from "../api/axios";

export default function StaffSelector({
  lat,
  lng,
  category,
  onStaffSelect,
  selectedStaffId,
}) {
  const [staff, setStaff] = useState([]);
  const [distantStaff, setDistantStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDistant, setShowDistant] = useState(false);

  useEffect(() => {
    if (lat && lng && category) {
      fetchNearbyStaff();
    }
  }, [lat, lng, category]);

  const fetchNearbyStaff = async () => {
    setLoading(true);
    setError("");
    setShowDistant(false);
    try {
      const { data } = await api.get(
        `/api/staff/nearby?lat=${lat}&lng=${lng}&category=${category}&radius=15`
      );
      setStaff(data.staff || []);

      if (!data.staff || data.staff.length === 0) {
        try {
          const { data: distantData } = await api.get(
            `/api/staff/nearby?lat=${lat}&lng=${lng}&category=${category}&radius=50`
          );
          setDistantStaff(distantData.staff || []);
        } catch {
          // Silently fail for distant staff
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to find nearby staff");
    } finally {
      setLoading(false);
    }
  };

  if (!lat || !lng || !category) {
    return (
      <div className="text-sm text-gray-500">
        Select location and category to see available staff
      </div>
    );
  }

  if (loading)
    return <div className="text-sm text-gray-500">Finding nearby staff...</div>;
  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;

  if (staff.length > 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-sm">
          ✅ Available Staff Near You ({staff.length})
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {staff.map((s) => (
            <div
              key={s._id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedStaffId === s._id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
              onClick={() => onStaffSelect(s._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold">
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.staff?.title || "Staff Member"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ⭐ {s.ratings?.average?.toFixed(1) || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.distance} km away
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                    ~{s.estimatedArrival} min
                  </div>
                </div>
              </div>
              {s.staff?.skills?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.staff.skills.slice(0, 3).map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {s.staff.skills.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{s.staff.skills.length - 3} more
                    </span>
                  )}
                </div>
              )}
              {s.staff?.contactPhone && (
                <div className="mt-1 text-xs text-gray-500">
                  📞 {s.staff.contactPhone}
                </div>
              )}
            </div>
          ))}
        </div>
        {selectedStaffId && (
          <div className="text-xs text-emerald-600 font-medium">
            ✓ Staff selected - they will be notified of your complaint
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-lg">⚠️</span>
        <div>
          <h3 className="font-medium text-sm text-yellow-900">
            No Staff Within 15 km
          </h3>
          <p className="text-xs text-yellow-700 mt-1">
            Unfortunately, there are no available staff members in your
            immediate area.
            {distantStaff.length > 0 ? (
              <>
                {" "}
                We have {distantStaff.length} staff member
                {distantStaff.length > 1 ? "s" : ""} available further away.
              </>
            ) : (
              " Please file your complaint and an admin will review it for assignment."
            )}
          </p>
        </div>
      </div>

      {distantStaff.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDistant(!showDistant)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            {showDistant ? "▼" : "▶"} Show {distantStaff.length} distant staff
            option{distantStaff.length > 1 ? "s" : ""}
          </button>

          {showDistant && (
            <div className="space-y-2 max-h-60 overflow-y-auto mt-3">
              {distantStaff.map((s) => (
                <div
                  key={s._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStaffId === s._id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-orange-200 hover:border-orange-300 bg-orange-50"
                  }`}
                  onClick={() => onStaffSelect(s._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500">
                          {s.staff?.title || "Staff Member"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ⭐ {s.ratings?.average?.toFixed(1) || "N/A"}
                      </div>
                      <div className="text-xs text-orange-600 font-medium">
                        {s.distance} km away
                      </div>
                      <div className="text-xs text-orange-500">
                        ~{s.estimatedArrival} min
                      </div>
                    </div>
                  </div>
                  {s.staff?.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.staff.skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {s.staff.skills.length > 3 && (
                        <span className="text-xs text-orange-600">
                          +{s.staff.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  {s.staff?.contactPhone && (
                    <div className="mt-1 text-xs text-gray-500">
                      📞 {s.staff.contactPhone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-600 italic">
        💡 Tip: Your complaint will still be filed and assigned to the
        appropriate department for review.
      </p>

      {selectedStaffId &&
        distantStaff.find((s) => s._id === selectedStaffId) && (
          <div className="text-xs text-orange-600 font-medium border-t border-yellow-200 pt-2 mt-2">
            ⚠️ Selected distant staff - response time will be longer than usual
          </div>
        )}
    </div>
  );
}
