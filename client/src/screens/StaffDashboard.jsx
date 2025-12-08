import KpiCard from '../components/KpiCard'
import ProfileCard from '../components/ProfileCard'

export default function StaffDashboard() {
  return (
    <div className="p-6 space-y-6">
      <ProfileCard />
      <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="My Open" value={0} />
        <KpiCard label="Due Soon" value={0} />
        <KpiCard label="Overdue" value={0} />
      </div>
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-lg font-medium mb-2">My Queue</h2>
        <p>Placeholder list of assigned complaints will appear here.</p>
      </div>
    </div>
  )
}
