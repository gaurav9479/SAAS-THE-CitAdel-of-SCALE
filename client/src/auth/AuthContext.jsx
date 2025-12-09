import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('user')
    if (cached) {
      try { return JSON.parse(cached) } catch { return null }
    }
    return null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  useEffect(() => {
    async function bootstrap() {
      if (!token) { setBootstrapping(false); return }
      try {
        const { data } = await api.get('/api/auth/me')
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      } catch (e) {
        // Only clear token on auth errors; keep token on network errors so user isn’t logged out on refresh
        const status = e?.response?.status
        if (status === 401 || status === 403) {
          setUser(null)
          setToken(null)
          localStorage.removeItem('user')
        }
      } finally {
        setBootstrapping(false)
      }
    }
    bootstrap()
  }, [token])

  const login = async (email, password, code) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password, code })
      if (data.emailVerificationRequired) {
        return { ok: false, verify: true, message: data.message }
      }
      if (data.user && data.token) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setToken(data.token)
        return { ok: true }
      }
      return { ok: false, message: 'Login failed' }
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || e.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', payload)
      if (data.emailVerificationRequired) {
        return { ok: false, verify: true, message: data.message, email: payload.email }
      }
      if (data.user && data.token) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setToken(data.token)
        return { ok: true }
      }
      return { ok: false, message: 'Registration failed' }
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || e.message }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (email, code) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/otp/verify-email', { email, code })
      // After verification, force user to login again to obtain token
      return { ok: true, message: data.message }
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || e.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
  }

  const value = useMemo(() => ({ user, token, loading, login, register, verifyEmail, logout, bootstrapping, setUser }), [user, token, loading, bootstrapping])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
