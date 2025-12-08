import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    const res = await login(email, password)
    if (res.ok) navigate('/')
    else setError(res.message || 'Login failed')
  }

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back! We're glad to see you again.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="text-red-200 text-sm">{error}</p>}
        <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition">{loading? 'Signing in...' : 'Sign in'}</button>
        <p className="text-white/80 text-sm">No account? <Link to="/register" className="underline">Register</Link></p>
      </form>
    </AuthLayout>
  )
}
