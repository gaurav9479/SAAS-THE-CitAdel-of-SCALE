import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

export default function People() {
  const { user } = useAuth();
  const cached = (() => {
    try {
      const raw = sessionStorage.getItem("people-cache");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [summary, setSummary] = useState(
    cached?.summary || { staffCount: 0, citizenCount: 0, pendingCount: 0 }
  );
  const [pending, setPending] = useState(cached?.pending || []);
  const [staff, setStaff] = useState(cached?.staff || []);
  const [citizens, setCitizens] = useState(cached?.citizens || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [sum, p, s, c] = await Promise.all([
          api.get("/api/users/org/summary"),
          api.get("/api/users", { params: { status: "pending" } }),
          api.get("/api/users", {
            params: { role: "staff", status: "active" },
          }),
          api.get("/api/users", {
            params: { role: "citizen", status: "active" },
          }),
        ]);
        setSummary(sum.data);
        setPending(p.data.users || []);
        setStaff(s.data.users || []);
        setCitizens(c.data.users || []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load people");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "people-cache",
        JSON.stringify({ summary, pending, staff, citizens })
      );
    } catch {}
  }, [summary, pending, staff, citizens]);

  const approve = async (id) => {
    try {
      await api.patch(`/api/users/${id}/approve`);
      setPending((prev) => prev.filter((u) => u._id !== id));
      setSummary((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
      }));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to approve user");
    }
  };

  const reject = async (id) => {
    try {
      await api.delete(`/api/users/${id}/reject`);
      setPending((prev) => prev.filter((u) => u._id !== id));
      setSummary((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
      }));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reject user");
    }
  };

  const rotateCode = async () => {
    if (!user?.organization?.id) return;
    setRotating(true);
    setError("");
    try {
      const { data } = await api.patch(
        `/api/orgs/${user.organization.id}/rotate-code`
      );
      const updatedUser = {
        ...user,
        organization: { ...user.organization, code: data.organization.code },
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.removeItem("people-cache");
      window.location.reload();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to rotate code");
    } finally {
      setRotating(false);
    }
  };

  if (!user || user.role !== "admin")
    return <div className="p-6">Forbidden</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">People</h1>
        <div className="flex items-center gap-2">
          {user?.organization?.code && (
            <div className="text-sm text-gray-600">
              Org Code:{" "}
              <code className="px-2 py-1 bg-gray-100 rounded border">
                {user.organization.code}
              </code>
            </div>
          )}
          <button
            onClick={rotateCode}
            disabled={rotating}
            className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-60"
          >
            {rotating ? "Rotating…" : "Rotate code"}
          </button>
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-600">Staff</div>
          <div className="text-2xl font-bold">
            {summary.staffCount}
            {summary.maxStaff ? ` / ${summary.maxStaff}` : ""}
          </div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-600">Citizens</div>
          <div className="text-2xl font-bold">
            {summary.citizenCount}
            {summary.maxCitizens ? ` / ${summary.maxCitizens}` : ""}
          </div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold">{summary.pendingCount}</div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <div className="font-semibold">Pending approvals</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-1">Name</th>
                <th className="text-left py-1">Email</th>
                <th className="text-left py-1">Role</th>
                <th className="text-left py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="py-1">{u.name}</td>
                  <td className="py-1">{u.email}</td>
                  <td className="py-1 capitalize">{u.role}</td>
                  <td className="py-1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(u._id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject(u._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-lg border p-4 space-y-2">
        <div className="font-semibold">Staff</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-1">Name</th>
              <th className="text-left py-1">Email</th>
              <th className="text-left py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="py-1">{u.name}</td>
                <td className="py-1">{u.email}</td>
                <td className="py-1 capitalize">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-2">
        <div className="font-semibold">Citizens</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-1">Name</th>
              <th className="text-left py-1">Email</th>
              <th className="text-left py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="py-1">{u.name}</td>
                <td className="py-1">{u.email}</td>
                <td className="py-1 capitalize">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
