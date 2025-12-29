import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import KpiCard from "../components/KpiCard";
import ProfileCard from "../components/ProfileCard";

export default function CitizenDashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/complaints/mine");
        setList(data.complaints || []);
      } catch (_e) {
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const c = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    for (const it of list) c[it.status] = (c[it.status] || 0) + 1;
    return c;
  }, [list]);

  return (
    <div className="p-6 space-y-6">
      <ProfileCard />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Citizen Dashboard</h1>
        <Link to="/departments" className="text-sm text-emerald-700 underline">
          View All Departments
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="My Open" value={counts.OPEN} />
        <KpiCard label="In Progress" value={counts.IN_PROGRESS} />
        <KpiCard label="Resolved" value={counts.RESOLVED} />
      </div>
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-medium mb-2">My Complaints</h2>
        {loading ? (
          <p>Loading…</p>
        ) : list.length === 0 ? (
          <p>No complaints yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm text-fade">
                  <th className="py-2">Title</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {list.map((it) => (
                  <tr key={it._id} className="border-t hover:bg-gray-50">
                    <td className="py-2">
                      <Link
                        to={`/complaints/${it._id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        {it.title}
                      </Link>
                    </td>
                    <td className="py-2">{it.category}</td>
                    <td className="py-2">{it.status}</td>
                    <td className="py-2">
                      {new Date(it.createdAt).toLocaleString()}
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
