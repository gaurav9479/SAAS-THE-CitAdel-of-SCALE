import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Demo() {
  const { demoLogin, loading } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDepts() {
      try {
        const { data } = await api.get("/api/demo/departments");
        setDepartments(data.departments || []);
        if (data.departments?.length > 0) {
          setSelectedDept(data.departments[0]._id);
        }
      } catch (err) {
        console.warn("Failed to load departments", err);
      }
    }
    loadDepts();
  }, []);

  const handleDemoAccess = async (role) => {
    setError("");
    const payload = {};
    if (role === "staff") {
      payload.departmentId = selectedDept;
    }
    const res = await demoLogin(role, payload);
    if (res.ok) {
      navigate("/");
    } else {
      setError(res.message || "Failed to enter sandbox");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.04),transparent_50%)]" />

      <div className="w-full max-w-5xl relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold tracking-wide shadow-sm">
            <span>🛡️ CitAdel of SCALE Recruiter Sandbox</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Experience Multi-Tenant SaaS
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Choose a mock persona to explore live workflows, SLA tracking, workforce proximity management, and Upstash serverless caches.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center max-w-md mx-auto text-sm shadow-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Admin Card */}
          <div className="group relative rounded-2xl bg-white border border-slate-200/80 p-8 space-y-6 hover:border-emerald-500/40 transition-all hover:shadow-[0_12px_40px_rgba(16,185,129,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                👑
              </div>
              <h3 className="text-xl font-bold text-slate-800">Organization Admin</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Assign technician staff, monitor departments, upgrade subscription plans, and track live SLA countdown timers.
              </p>
            </div>
            <button
              onClick={() => handleDemoAccess("admin")}
              disabled={loading}
              className="mt-8 w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              Continue as Admin →
            </button>
          </div>

          {/* Citizen Card */}
          <div className="group relative rounded-2xl bg-white border border-slate-200/80 p-8 space-y-6 hover:border-emerald-500/40 transition-all hover:shadow-[0_12px_40px_rgba(16,185,129,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                👤
              </div>
              <h3 className="text-xl font-bold text-slate-800">Demo Employee</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Submit requests, view real-time resolving status, add custom comments, and review resolved tickets.
              </p>
            </div>
            <button
              onClick={() => handleDemoAccess("employee")}
              disabled={loading}
              className="mt-8 w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              Continue as Employee →
            </button>
          </div>

          {/* Staff Card */}
          <div className="group relative rounded-2xl bg-white border border-slate-200/80 p-8 space-y-6 hover:border-emerald-500/40 transition-all hover:shadow-[0_12px_40px_rgba(16,185,129,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                🛠️
              </div>
              <h3 className="text-xl font-bold text-slate-800">Department Staff</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Choose a specialized department below. View assigned work and resolve tickets on location.
              </p>
              
              <div className="space-y-2 pt-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-emerald-500 transition-all shadow-sm"
                >
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => handleDemoAccess("staff")}
              disabled={loading}
              className="mt-8 w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              Continue as Staff →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
