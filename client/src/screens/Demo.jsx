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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.15),transparent_50%)]" />

      <div className="w-full max-w-4xl relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <span>🛡️ CitAdel of SCALE Recruiter Sandbox</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-200 bg-clip-text text-transparent">
            Experience Multi-Tenant SaaS
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Choose a mock persona to explore live workflows, SLA tracking, workforce proximity management, and Upstash serverless caches.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-500/30 text-red-200 rounded-xl text-center max-w-md mx-auto text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Admin Card */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-6 hover:border-indigo-500/30 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👑
              </div>
              <h3 className="text-xl font-semibold text-slate-200">Organization Admin</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Assign technician staff, monitor departments, upgrade subscription plans, and track live SLA countdown timers.
              </p>
            </div>
            <button
              onClick={() => handleDemoAccess("admin")}
              disabled={loading}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              Continue as Admin →
            </button>
          </div>

          {/* Citizen Card */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-6 hover:border-pink-500/30 transition-all hover:shadow-[0_0_30px_rgba(236,72,153,0.1)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                👤
              </div>
              <h3 className="text-xl font-semibold text-slate-200">Demo Employee</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Submit requests, view real-time resolving status, add custom comments, and review resolved tickets.
              </p>
            </div>
            <button
              onClick={() => handleDemoAccess("employee")}
              disabled={loading}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-medium shadow-lg hover:shadow-pink-500/20 transition-all disabled:opacity-50"
            >
              Continue as Employee →
            </button>
          </div>

          {/* Staff Card */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-6 hover:border-purple-500/30 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🛠️
              </div>
              <h3 className="text-xl font-semibold text-slate-200">Department Staff</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Choose a specialized department below. View assigned work and resolve tickets on location.
              </p>
              
              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-slate-400 font-medium">Select Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-300 outline-none focus:border-purple-500/50"
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
              className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              Continue as Staff →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
