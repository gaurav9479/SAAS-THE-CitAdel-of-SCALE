import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState("Complaint not found");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/complaints/${id}`);
        setComplaint(data.complaint);
      } catch (e) {
        setComplaint(null);
        setError(e?.response?.data?.message || "Complaint not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submitReview = async () => {
    if (!complaint?.assignedTo) return;
    setSubmittingReview(true);
    try {
      await api.post("/api/reviews", {
        complaintId: complaint._id,
        staffId: complaint.assignedTo._id || complaint.assignedTo,
        rating,
        comment,
      });
      alert("Review submitted!");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!complaint) return <div className="p-6">{error}</div>;

  const canReview =
    user?.role === "citizen" &&
    complaint.status === "RESOLVED" &&
    complaint.createdBy === user?.id;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link to="/" className="text-sm text-emerald-700 underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">{complaint.title}</h1>
      <div className="bg-white rounded-xl p-4 shadow space-y-3">
        <div>
          <span className="font-medium">Category:</span> {complaint.category}
        </div>
        <div>
          <span className="font-medium">Priority:</span> {complaint.priority}
        </div>
        <div>
          <span className="font-medium">Status:</span>{" "}
          <span
            className={`px-2 py-1 rounded text-sm ${
              complaint.status === "OPEN"
                ? "bg-yellow-100 text-yellow-800"
                : complaint.status === "IN_PROGRESS"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {complaint.status}
          </span>
        </div>
        <div>
          <span className="font-medium">Description:</span>{" "}
          {complaint.description}
        </div>
        {complaint.location?.lat && (
          <div>
            <span className="font-medium">Location:</span>{" "}
            {complaint.location.lat}, {complaint.location.lng}
          </div>
        )}
        {complaint.assignedDepartmentId?.name && (
          <div>
            <span className="font-medium">Department:</span>{" "}
            {complaint.assignedDepartmentId.name}
          </div>
        )}
        {complaint.assignedTo?.name && (
          <div>
            <span className="font-medium">Assigned To:</span>{" "}
            {complaint.assignedTo.name}
          </div>
        )}
        {complaint.slaDeadline && (
          <div>
            <span className="font-medium">SLA Deadline:</span>{" "}
            {new Date(complaint.slaDeadline).toLocaleString()}
          </div>
        )}
        {complaint.resolutionTime && (
          <div>
            <span className="font-medium">Resolved At:</span>{" "}
            {new Date(complaint.resolutionTime).toLocaleString()}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-medium mb-3">Status Timeline</h2>
        <div className="space-y-2">
          {(complaint.statusHistory || []).map((h, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="text-fade">
                {new Date(h.at).toLocaleString()}
              </span>
              <span>
                {h.from || "NEW"} → {h.to}
              </span>
              {h.note && <span className="text-fade">({h.note})</span>}
            </div>
          ))}
        </div>
      </div>

      {canReview && (
        <div className="bg-white rounded-xl p-4 shadow space-y-3">
          <h2 className="text-lg font-medium">Rate this resolution</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={`px-3 py-1 rounded ${
                  rating === r ? "bg-emerald-600 text-white" : "bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            onClick={submitReview}
            disabled={submittingReview}
            className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}
