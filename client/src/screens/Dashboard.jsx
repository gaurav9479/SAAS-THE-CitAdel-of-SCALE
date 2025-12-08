import { useAuth } from '../auth/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
      <p>Role: <b>{user?.role}</b></p>
      <button onClick={logout} className="px-3 py-2 bg-gray-200 rounded">Logout</button>
    </div>
  )
}
