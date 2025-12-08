import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ProfileCard() {
  const { user, logout } = useAuth()
  if (!user) return null
  const initials = (user.name || '?').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">
          {initials}
        </div>
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-fade">{user.email} • {user.role}</div>
          {user?.staff?.isWorkingToday !== undefined && (
            <div className={`text-xs ${user.staff.isWorkingToday ? 'text-green-600' : 'text-red-600'}`}>
              {user.staff.isWorkingToday ? '🟢 Working today' : '🔴 Not working today'}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          to="/profile/edit"
          className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-sm"
        >
          Edit Profile
        </Link>
        <button onClick={logout} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Logout</button>
      </div>
    </div>
  )
}
