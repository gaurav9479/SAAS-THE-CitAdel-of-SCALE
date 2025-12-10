import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PlanBadge from './PlanBadge'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const role = user?.role

  const nav = [
    { to: '/', label: 'Dashboard', roles: ['admin','staff','citizen'] },
    { to: '/profile/edit', label: 'Profile', roles: ['admin','staff','citizen'] },
    { to: '/people', label: 'People', roles: ['admin'] },
    { to: '/billing', label: 'Billing', roles: ['admin'] },
    { to: '/departments', label: 'Departments', roles: ['admin','staff'] },
    { to: '/complaints/new', label: 'New Complaint', roles: ['citizen','admin','staff'] },
  ].filter(item => item.roles.includes(role))

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 hidden md:flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="text-lg font-semibold">CitAdel</div>
          <div className="text-sm text-gray-600 truncate">{user?.name}</div>
          {user?.organization && (
            <div className="mt-2 flex items-center gap-2">
              <PlanBadge plan={user.organization.plan} />
              {user.organization.code && <span className="text-xs text-gray-500">Code: {user.organization.code}</span>}
            </div>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200">
          <button onClick={logout} className="w-full px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100">
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-3 bg-white border-b border-gray-200">
          <div className="text-lg font-semibold">CitAdel</div>
          <div className="flex items-center gap-2">
            {user?.organization && <PlanBadge plan={user.organization.plan} />}
            <Link to="/profile/edit" className="text-sm text-emerald-700 underline">Profile</Link>
          </div>
        </header>
        <main className="p-4 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

