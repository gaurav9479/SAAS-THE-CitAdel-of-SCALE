import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import KpiCard from '../components/KpiCard'
import ProfileCard from '../components/ProfileCard'

export default function AdminDashboard() {
  const [data, setData] = useState({ total: 0, byStatus: {}, overdue: 0, categories: [] })
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [s, c, staffList] = await Promise.all([
          api.get('/api/analytics/summary'),
          api.get('/api/analytics/categories'),
          api.get('/api/users?role=staff'),
        ])
        setData({ ...s.data, categories: c.data.categories })
        setStaff(staffList.data.users || [])
      } catch (e) {
        // noop placeholder
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const by = data.byStatus || {}

  return (
    <div className="p-6 space-y-6">
      <ProfileCard />
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total" value={data.total} />
        <KpiCard label="Open" value={by.OPEN || 0} />
        <KpiCard label="In Progress" value={by.IN_PROGRESS || 0} />
        <KpiCard label="Overdue" value={data.overdue} />
      </div>
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-medium mb-2">Top Categories</h2>
        <ul className="list-disc ml-6">
          {loading ? <li>Loading…</li> : (data.categories || []).map(c => (
            <li key={c._id}>{c._id} — {c.count}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-medium mb-3">Registered Staff ({staff.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : staff.length === 0 ? (
          <p className="text-fade">No staff registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-fade border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Department</th>
                  <th className="py-2">Work Area</th>
                  <th className="py-2">Status & Rating</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s._id} className="border-t hover:bg-gray-50">
                    <td className="py-2">
                      <Link to={`/staff/${s._id}`} className="text-emerald-700 hover:underline font-medium">{s.name}</Link>
                    </td>
                    <td className="py-2">{s.email}</td>
                    <td className="py-2">{s.departmentId?.name || 'N/A'}</td>
                    <td className="py-2">{s.staff?.workArea?.city || 'N/A'} {s.staff?.workArea?.zones?.length > 0 && `(${s.staff.workArea.zones.join(', ')})`}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className={s.staff?.isWorkingToday ? 'text-green-600' : 'text-red-600'}>
                          {s.staff?.isWorkingToday ? '🟢' : '🔴'}
                        </span>
                        <span>⭐ {s.ratings?.average?.toFixed(1) || 0} ({s.ratings?.count || 0})</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
