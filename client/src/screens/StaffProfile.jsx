import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function StaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState({ from: "", to: "" });
  const [complaintFilter, setComplaintFilter] = useState({
    status: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [u, r, c] = await Promise.all([
          api.get(`/api/users/${id}`),
          api.get(
            `/api/reviews/staff/${id}?${new URLSearchParams(reviewFilter)}`
          ),
          api.get(
            `/api/complaints/staff/${id}?${new URLSearchParams(
              complaintFilter
            )}`
          ),
        ]);
        setStaff(u.data.user);
        setReviews(r.data.reviews || []);
        setComplaints(c.data.complaints || []);
      } catch {
        setStaff(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, reviewFilter, complaintFilter]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!staff) return <div className="p-6">Staff not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-emerald-700 underline"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-semibold">{staff.name}</h1>
      <div className="bg-white rounded-xl p-4 shadow space-y-2">
        <div>
          <span className="font-medium">Email:</span> {staff.email}
        </div>
        <div>
          <span className="font-medium">Department:</span>{" "}
          {staff.departmentId?.name || "N/A"}
        </div>
        {staff.staff?.title && (
          <div>
            <span className="font-medium">Title:</span> {staff.staff.title}
          </div>
        )}
        {staff.staff?.skills?.length > 0 && (
          <div>
            <span className="font-medium">Skills:</span>{" "}
            {staff.staff.skills.join(", ")}
          </div>
        )}
        {staff.staff?.workArea?.city && (
          <div>
            <span className="font-medium">Work Area:</span>{" "}
            {staff.staff.workArea.city}
          </div>
        )}
        {staff.staff?.workArea?.zones?.length > 0 && (
          <div>
            <span className="font-medium">Zones:</span>{" "}
            {staff.staff.workArea.zones.join(", ")}
          </div>
        )}
        {staff.staff?.contactPhone && (
          <div>
            <span className="font-medium">Contact:</span>{" "}
            {staff.staff.contactPhone}
          </div>
        )}
        <div>
          <span className="font-medium">Status:</span>{" "}
          <span
            className={
              staff.staff?.isWorkingToday ? "text-green-600" : "text-red-600"
            }
          >
            {staff.staff?.isWorkingToday
              ? "🟢 Working today"
              : "🔴 Not working today"}
          </span>
        </div>
        <div>
          <span className="font-medium">Rating:</span> ⭐{" "}
          {staff.ratings?.average?.toFixed(1) || 0} ({staff.ratings?.count || 0}{" "}
          reviews)
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Reviews ({reviews.length})</h2>
          <div className="flex gap-2">
            <input
              type="date"
              value={reviewFilter.from}
              onChange={(e) =>
                setReviewFilter({ ...reviewFilter, from: e.target.value })
              }
              className="border rounded p-2 text-sm"
              placeholder="From"
            />
            <input
              type="date"
              value={reviewFilter.to}
              onChange={(e) =>
                setReviewFilter({ ...reviewFilter, to: e.target.value })
              }
              className="border rounded p-2 text-sm"
              placeholder="To"
            />
          </div>
        </div>
        {reviews.length === 0 ? (
          <p className="text-fade">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="border-t pt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {r.citizenId?.name || "Anonymous"}
                    </div>
                    <div className="text-sm text-fade">
                      {r.complaintId?.title} • {r.complaintId?.category}
                    </div>
                  </div>
                  <div className="text-yellow-600">{"⭐".repeat(r.rating)}</div>
                </div>
                {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
                <div className="text-xs text-fade mt-1">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">
            Work Done ({complaints.length})
          </h2>
          <div className="flex gap-2">
            <select
              value={complaintFilter.status}
              onChange={(e) =>
                setComplaintFilter({
                  ...complaintFilter,
                  status: e.target.value,
                })
              }
              className="border rounded p-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <input
              type="date"
              value={complaintFilter.from}
              onChange={(e) =>
                setComplaintFilter({ ...complaintFilter, from: e.target.value })
              }
              className="border rounded p-2 text-sm"
              placeholder="From"
            />
            <input
              type="date"
              value={complaintFilter.to}
              onChange={(e) =>
                setComplaintFilter({ ...complaintFilter, to: e.target.value })
              }
              className="border rounded p-2 text-sm"
              placeholder="To"
            />
          </div>
        </div>
        {complaints.length === 0 ? (
          <p className="text-fade">No complaints assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-fade border-b">
                  <th className="py-2">Title</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} className="border-t hover:bg-gray-50">
                    <td className="py-2">{c.title}</td>
                    <td className="py-2">{c.category}</td>
                    <td className="py-2">{c.status}</td>
                    <td className="py-2">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
