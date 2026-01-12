import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import KpiCard from '../components/KpiCard';
import ProfileCard from '../components/ProfileCard';

export default function StaffDashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/complaints/my-assignments');
        setList(data.complaints || []);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const now = new Date();
    const c = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, dueSoon: 0, overdue: 0 };
    
    for (const it of list) {
      c[it.status] = (c[it.status] || 0) + 1;
      
      if (it.slaDeadline) {
        const deadline = new Date(it.slaDeadline);
        const hoursUntilDue = (deadline - now) / (1000 * 60 * 60);
        
        if (hoursUntilDue < 0 && it.status !== 'RESOLVED') {
          c.overdue++;
        } else if (hoursUntilDue < 24 && hoursUntilDue >= 0 && it.status !== 'RESOLVED') {
          c.dueSoon++;
        }
      }
    }
    return c;
  }, [list]);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await api.patch(`/api/complaints/${complaintId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus}`
      });
      
      // Refresh list
      const { data } = await api.get('/api/complaints/my-assignments');
      setList(data.complaints || []);
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Status update error:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <ProfileCard />
      <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="My Open" value={counts.OPEN} />
        <KpiCard label="In Progress" value={counts.IN_PROGRESS} />
        <KpiCard label="Due Soon" value={counts.dueSoon} />
        <KpiCard label="Overdue" value={counts.overdue} />
      </div>
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-medium mb-2">My Assigned Complaints</h2>
        {loading ? (
          <p>Loading…</p>
        ) : list.length === 0 ? (
          <p>No complaints assigned to you yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-fade border-b">
                  <th className="py-2">Title</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Priority</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Reported By</th>
                  <th className="py-2">SLA Deadline</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((complaint) => {
                  const deadline = complaint.slaDeadline ? new Date(complaint.slaDeadline) : null;
                  const now = new Date();
                  const isOverdue = deadline && deadline < now && complaint.status !== 'RESOLVED';
                  const hoursUntilDue = deadline ? (deadline - now) / (1000 * 60 * 60) : null;
                  const isDueSoon = hoursUntilDue !== null && hoursUntilDue < 24 && hoursUntilDue >= 0 && complaint.status !== 'RESOLVED';

                  return (
                    <tr key={complaint._id} className="border-t hover:bg-gray-50">
                      <td className="py-2">
                        <Link
                          to={`/complaints/${complaint._id}`}
                          className="text-emerald-700 hover:underline"
                        >
                          {complaint.title}
                        </Link>
                      </td>
                      <td className="py-2">{complaint.category}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            complaint.priority === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : complaint.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            complaint.status === 'OPEN'
                              ? 'bg-yellow-100 text-yellow-800'
                              : complaint.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {complaint.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {complaint.createdBy?.name || complaint.reporterSnapshot?.name || 'N/A'}
                      </td>
                      <td className="py-2">
                        {deadline ? (
                          <span
                            className={
                              isOverdue
                                ? 'text-red-600 font-semibold'
                                : isDueSoon
                                ? 'text-orange-600 font-semibold'
                                : ''
                            }
                          >
                            {deadline.toLocaleString()}
                            {isOverdue && ' (OVERDUE)'}
                            {isDueSoon && ' (DUE SOON)'}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-2">
                        {complaint.status !== 'RESOLVED' && (
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={complaint.status}
                            onChange={(e) => handleStatusUpdate(complaint._id, e.target.value)}
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>
                        )}
                        {complaint.status === 'RESOLVED' && (
                          <span className="text-green-600 text-sm">✓ Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
