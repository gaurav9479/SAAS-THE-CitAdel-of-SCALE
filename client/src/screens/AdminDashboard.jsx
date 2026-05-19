import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import KpiCard from "../components/KpiCard";
import ProfileCard from "../components/ProfileCard";
import SlaTimer from "../components/SlaTimer";

function AssignmentModal({ complaint, staff, departments, onClose, onAssign }) {
  const [selectedStaff, setSelectedStaff] = useState(complaint?.assignedTo?._id || '');
  const [selectedDept, setSelectedDept] = useState(complaint?.assignedDepartmentId?._id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedStaff && !selectedDept) {
      alert('Please select at least a staff member or department');
      return;
    }
    
    setLoading(true);
    try {
      await onAssign(complaint._id, {
        staffId: selectedStaff || undefined,
        assignedDepartmentId: selectedDept || undefined,
        note: note || 'Manual assignment by admin'
      });
      onClose();
    } catch (err) {
      alert('Failed to assign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter staff by selected department
  const filteredStaff = selectedDept 
    ? staff.filter(s => (s.departmentId?._id || s.departmentId) === selectedDept)
    : staff;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Assign Complaint</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-sm">{complaint.title}</div>
          <div className="text-xs text-gray-600 mt-1">
            Category: {complaint.category} | Priority: {complaint.priority}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select 
              className="w-full border rounded-lg p-2"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedStaff(''); // Reset staff when dept changes
              }}
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assign to Staff</label>
            <select 
              className="w-full border rounded-lg p-2"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              disabled={!selectedDept}
            >
              <option value="">Select Staff Member</option>
              {filteredStaff.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.staff?.isWorkingToday ? '🟢' : '🔴'} (⭐ {s.ratings?.average?.toFixed(1) || 0})
                </option>
              ))}
            </select>
            {!selectedDept && <p className="text-xs text-gray-500 mt-1">Select a department first</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note (optional)</label>
            <textarea 
              className="w-full border rounded-lg p-2"
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add assignment note..."
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleAssign}
            disabled={loading || (!selectedStaff && !selectedDept)}
            className="flex-1 bg-emerald-600 text-white rounded-lg py-2 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 rounded-lg py-2 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState({
    total: 0,
    byStatus: {},
    overdue: 0,
    categories: [],
  });
  const [staff, setStaff] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [activeTab, statusFilter]);

  async function fetchDashboardData() {
    try {
      setError(null);
      const [summaryRes, categoriesRes, staffRes, deptRes, complaintsRes] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/categories"),
        api.get("/api/users?role=staff"),
        api.get("/api/departments"),
        api.get("/api/complaints?limit=50")
      ]);
      
      setData({ 
        ...summaryRes.data, 
        categories: categoriesRes.data.categories 
      });
      setStaff(staffRes.data.users || []);
      setDepartments(deptRes.data.departments || []);
      setComplaints(complaintsRes.data.complaints || []);
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComplaints() {
    try {
      const params = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50';
      const res = await api.get(`/api/complaints${params}`);
      setComplaints(res.data.complaints || []);
    } catch (e) {
      console.error('Failed to fetch complaints:', e);
      setError('Failed to load complaints.');
    }
  }

  async function handleAssignComplaint(complaintId, assignmentData) {
    try {
      await api.patch(`/api/complaints/${complaintId}/assign`, assignmentData);
      // Refresh complaints list
      await fetchComplaints();
      alert('Complaint assigned successfully!');
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Assignment failed');
    }
  }

  const by = data.byStatus || {};
  const priorityColors = {
    HIGH: 'text-red-600 bg-red-50',
    MEDIUM: 'text-orange-600 bg-orange-50',
    LOW: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <ProfileCard />
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'complaints' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'staff' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Staff
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Complaints" value={data.total} />
            <KpiCard label="Open" value={by.OPEN || 0} />
            <KpiCard label="In Progress" value={by.IN_PROGRESS || 0} />
            <KpiCard label="Overdue" value={data.overdue} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow">
              <h2 className="text-lg font-medium mb-3">Top Categories</h2>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {(data.categories || []).map((c) => (
                    <div key={c._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span className="font-medium">{c._id}</span>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h2 className="text-lg font-medium mb-3">Quick Stats</h2>
              <div className="space-y-2">
                <div className="flex justify-between p-2">
                  <span>Active Staff</span>
                  <span className="font-semibold">{staff.filter(s => s.staff?.isWorkingToday).length}/{staff.length}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span>Resolved</span>
                  <span className="font-semibold">{by.RESOLVED || 0}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span>Unassigned</span>
                  <span className="font-semibold text-red-600">{complaints.filter(c => !c.assignedTo).length}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'complaints' && (
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 className="text-lg font-medium">Complaints Management</h2>
            <select 
              className="border rounded-lg px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600 border-b">
                  <th className="py-3 px-2">Title</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Priority</th>
                  <th className="py-3 px-2">SLA Countdown</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Assigned To</th>
                  <th className="py-3 px-2">Department</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Link to={`/complaints/${c._id}`} className="font-medium text-emerald-700 hover:underline">{c.title}</Link>
                      <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-2">{c.category}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[c.priority] || 'bg-gray-100'}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <SlaTimer createdAt={c.createdAt} priority={c.priority} status={c.status} />
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        c.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                        c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {c.assignedTo ? (
                        <span className="text-emerald-700">{c.assignedTo.name}</span>
                      ) : (
                        <span className="text-red-600 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-2">{c.assignedDepartmentId?.name || 'N/A'}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => setAssigningComplaint(c)}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                      >
                        {c.assignedTo ? 'Reassign' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {complaints.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No complaints found for the selected filter.
            </div>
          )}
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="text-lg font-medium mb-3">
            Registered Staff ({staff.length})
          </h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : staff.length === 0 ? (
            <p className="text-gray-500">No staff registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-600 border-b">
                    <th className="py-3">Name</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Department</th>
                    <th className="py-3">Work Area</th>
                    <th className="py-3">Status & Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s._id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <Link to={`/staff/${s._id}`} className="text-emerald-700 font-medium hover:underline">
                          {s.name}
                        </Link>
                      </td>
                      <td className="py-3">{s.email}</td>
                      <td className="py-3">{s.departmentId?.name || "N/A"}</td>
                      <td className="py-3">
                        {s.staff?.workArea?.city || "N/A"}{" "}
                        {s.staff?.workArea?.zones?.length > 0 &&
                          `(${s.staff.workArea.zones.join(", ")})`}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className={s.staff?.isWorkingToday ? "text-green-600" : "text-red-600"}>
                            {s.staff?.isWorkingToday ? "🟢" : "🔴"}
                          </span>
                          <span>
                            ⭐ {s.ratings?.average?.toFixed(1) || 0} ({s.ratings?.count || 0})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {assigningComplaint && (
        <AssignmentModal
          complaint={assigningComplaint}
          staff={staff}
          departments={departments}
          onClose={() => setAssigningComplaint(null)}
          onAssign={handleAssignComplaint}
        />
      )}
    </div>
  );
}
