import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Dashboard from '../screens/Dashboard'
import AdminDashboard from '../screens/AdminDashboard'
import StaffDashboard from '../screens/StaffDashboard'
import CitizenDashboard from '../screens/CitizenDashboard'
import NewComplaint from '../screens/NewComplaint'
import Departments from '../screens/Departments'
import ComplaintDetail from '../screens/ComplaintDetail'
import StaffProfile from '../screens/StaffProfile'
import ProfileEdit from '../screens/ProfileEdit'
import ProtectedRoute from '../auth/ProtectedRoute'
import { useAuth } from '../auth/AuthContext'
import PlanBanner from '../components/PlanBanner'
import PlanBadge from '../components/PlanBadge'
import Billing from '../screens/Billing'
import People from '../screens/People'

function RoleDashboard() {
  const { user } = useAuth()
  if (!user) return null
  const header = (
    <div className="flex items-center gap-3">
      <h1 className="text-xl font-semibold text-gray-900">Welcome, {user.name}</h1>
      <PlanBadge plan={user?.organization?.plan} />
    </div>
  )
  if (user.role === 'admin') return <div className="space-y-4 p-4">{header}<PlanBanner /><AdminDashboard /></div>
  if (user.role === 'staff') return <div className="space-y-4 p-4">{header}<PlanBanner /><StaffDashboard /></div>
  return (
    <div className="space-y-4 p-4">
      {header}
      <PlanBanner />
      <div className="flex justify-end">
        <Link to="/complaints/new" className="px-4 py-2 rounded bg-emerald-600 text-white">New Complaint</Link>
      </div>
      <CitizenDashboard />
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/complaints/new',
    element: (
      <ProtectedRoute roles={['citizen','admin','staff']}>
        <NewComplaint />
      </ProtectedRoute>
    ),
  },
  {
    path: '/departments',
    element: (
      <ProtectedRoute>
        <Departments />
      </ProtectedRoute>
    ),
  },
  {
    path: '/complaints/:id',
    element: (
      <ProtectedRoute>
        <ComplaintDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/staff/:id',
    element: (
      <ProtectedRoute>
        <StaffProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/edit',
    element: (
      <ProtectedRoute>
        <ProfileEdit />
      </ProtectedRoute>
    ),
  },
  {
    path: '/people',
    element: (
      <ProtectedRoute roles={['admin']}>
        <People />
      </ProtectedRoute>
    ),
  },
  {
    path: '/billing',
    element: (
      <ProtectedRoute roles={['admin']}>
        <Billing />
      </ProtectedRoute>
    ),
  }
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
