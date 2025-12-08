import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    async function bootstrap() {
      if (!token) { setBootstrapping(false); return }
      try {
        const { data } = await api.get('/api/auth/me')
        setUser(data.user)
      } catch (_e) {
        setUser(null)
        setToken(null)
      } finally {
        setBootstrapping(false)
      }
    }
    bootstrap()
  }, [token])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      setUser(data.user)
      setToken(data.token)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || e.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async ({ name, email, password, role }) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password, role })
      setUser(data.user)
      setToken(data.token)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || e.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const value = useMemo(() => ({ user, token, loading, login, register, logout, bootstrapping, setUser }), [user, token, loading, bootstrapping])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
