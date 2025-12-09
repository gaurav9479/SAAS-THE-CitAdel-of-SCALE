import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import api from '../api/client'
import MapPicker from '../components/MapPicker'
import PhoneInput from 'react-phone-number-input'
import { parsePhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css'

const val = [
  'Road Damage',
  'Potholes',
  'Street Lights Not Working',
  'Traffic Signal Issue',
  'Drainage Blocked',
  'Water Leakage',
  'No Water Supply',
  'Water Quality Issue',
  'Sewage Overflow',
  'Garbage Not Collected',
  'Illegal Dumping',
  'Public Toilet Issue',
  'Park Maintenance',
  'Tree Fallen',
  'Stray Animals',
  'Noise Pollution',
  'Air Pollution',
  'Building Violation',
  'Illegal Construction',
  'Parking Issue',
  'Encroachment',
  'Other',
]

export default function Register() {
  const { register, verifyEmail, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('citizen')
  const [orgCode, setOrgCode] = useState('')
  const [orgName, setOrgName] = useState('')
  const [phone, setPhone] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [title, setTitle] = useState('')
  const [skills, setSkills] = useState('')
  const [workCity, setWorkCity] = useState('')
  const [workZones, setWorkZones] = useState('')
  const [workLat, setWorkLat] = useState(28.6139)
  const [workLng, setWorkLng] = useState(77.2090)
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [useSameContact, setUseSameContact] = useState(false)
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')
  const [verifyMode, setVerifyMode] = useState(false)
  const [verifyEmailAddress, setVerifyEmailAddress] = useState('')
  const [otp, setOtp] = useState('')
  const navigate = useNavigate()

  // Phone validation using libphonenumber-js
  const isValidPhone = (phone) => {
    if (!phone) return null
    const cleaned = phone.replace(/\s+/g, '')
    return /^\+?91\d{10}$/.test(cleaned)
  }

  const formatPhone = (phone) => {
    if (!phone) return ''
    try {
      const phoneNumber = parsePhoneNumber(phone)
      return phoneNumber ? phoneNumber.formatInternational() : phone
    } catch {
      return phone
    }
  }

  useEffect(() => {
    if (role === 'staff') {
      (async () => {
        try {
          const { data } = await api.get('/api/departments')
          setDepartments(data.departments || [])
        } catch {}
      })()
    }
  }, [role])

  useEffect(() => {
    if (useSameContact && role === 'staff') {
      setContactPhone(phone)
      setContactEmail(email)
    }
  }, [phone, email, useSameContact, role])

  const onSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!name || !email || !password) {
      setError('Name, email, and password are required')
      return
    }

    // Validate phone if provided
    // if (phone && !isValidPhone(phone)) {
    //   setError('Please enter a valid phone number')
    //   return
    // }

    // Validate staff-specific requirements
    if (role === 'staff' && departmentId) {
      if (workLat == null || workLng == null || Number.isNaN(workLat) || Number.isNaN(workLng)) {
        setError('Please select your working area on the map or use your location')
        return
      }
      if (!isValidPhone(contactPhone)) {
        setError('Please enter a valid contact phone number')
        return
      }
    }

    const payload = { name, email, password, role }
    if (orgCode) payload.organizationCode = orgCode
    if (orgName) payload.organizationName = orgName
    if (phone) payload.phone = phone

    if (role === 'staff' && departmentId) {
      payload.departmentId = departmentId
      payload.staff = {
        title,
        skills: skills.split(',').map(s=>s.trim()).filter(Boolean),
        workArea: {
          city: workCity,
          zones: workZones.split(',').map(s=>s.trim()).filter(Boolean),
          location: { lat: Number(workLat), lng: Number(workLng) },
        },
        contactPhone,
        contactEmail,
      }
    }

    const res = await register(payload)
    if (res.ok) {
      navigate('/')
      return
    }
    if (res.verify) {
      setVerifyMode(true)
      setVerifyEmailAddress(email)
      setError('Enter the OTP sent to your email to verify.')
      return
    }
    setError(res.message || 'Registration failed')
  }

  const onVerify = async (e) => {
    e.preventDefault()
    if (!otp || !verifyEmailAddress) {
      setError('Enter OTP to verify')
      return
    }
    const res = await verifyEmail(verifyEmailAddress, otp)
    if (res.ok) {
      setError('Verified! Please log in now.')
      setVerifyMode(false)
    } else {
      setError(res.message || 'Verification failed')
    }
  }

  if (verifyMode) {
    return (
      <AuthLayout title="Verify your email" subtitle="Enter the OTP sent to your email">
        <form onSubmit={onVerify} className="space-y-4">
          {error && <p className="text-red-200 text-sm">{error}</p>}
          <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Email" type="email" value={verifyEmailAddress} disabled />
          <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="6-digit OTP" value={otp} onChange={(e)=>setOtp(e.target.value)} />
          <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition">{loading? 'Verifying...' : 'Verify email'}</button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create account" subtitle="Join the Caravan and start reporting or resolving issues.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="text-red-200 text-sm">{error}</p>}
        <input autoComplete="name" className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input autoComplete="email" className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <div className="relative">
          <input
            autoComplete="new-password"
            className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 pr-11 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={()=>setShowPassword(v=>!v)}
            className="absolute inset-y-0 right-0 px-3 text-sm text-emerald-700 hover:text-emerald-900"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number (optional)</label>
          <PhoneInput
            className="phone-input"
            value={phone}
            onChange={setPhone}
            defaultCountry="IN"
            placeholder="Enter phone number"
            inputClassName="w-full rounded-lg bg-white/90 text-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {phone && (
            <div className="text-xs mt-1">
              <span className={isValidPhone(phone) ? 'text-green-600' : 'text-red-600'}>
                {isValidPhone(phone) ? '✓ Valid phone number' : '✗ Invalid phone number'}
              </span>
              {isValidPhone(phone) && <span className="text-fade ml-2">({formatPhone(phone)})</span>}
            </div>
          )}
        </div>
        <select className="w-full rounded-lg bg-white/90 text-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="citizen">Citizen</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        {role === 'admin' && (
          <>
            <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Organization Name" value={orgName} onChange={(e)=>setOrgName(e.target.value)} />
            <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Organization Code (leave blank to auto-generate)" value={orgCode} onChange={(e)=>setOrgCode(e.target.value.toUpperCase())} />
          </>
        )}
        {role !== 'admin' && (
          <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Organization Code (from your admin)" value={orgCode} onChange={(e)=>setOrgCode(e.target.value.toUpperCase())} />
        )}
        {role === 'staff' && (
          <>
            <select className="w-full rounded-lg bg-white/90 text-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" value={departmentId} onChange={(e)=>setDepartmentId(e.target.value)}>
              <option value="">Select Department</option>
              {departments.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Title (e.g., Field Engineer)" value={title} onChange={(e)=>setTitle(e.target.value)} />
            <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Skills (comma-separated)" value={skills} onChange={(e)=>setSkills(e.target.value)} />
            <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Work City/Area" value={workCity} onChange={(e)=>setWorkCity(e.target.value)} />
            <input className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Work Zones (comma-separated)" value={workZones} onChange={(e)=>setWorkZones(e.target.value)} />

            <div>
              <label className="block text-sm font-medium mb-1">Working Area Location</label>
              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setWorkLat(pos.coords.latitude)
                          setWorkLng(pos.coords.longitude)
                        },
                        () => setError('Could not fetch your location, please allow permission or pick on map')
                      )
                    } else {
                      setError('Geolocation not supported in this browser')
                    }
                  }}
                  className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-sm"
                >
                  Use my location
                </button>
                <div className="text-xs text-fade self-center">Lat: {Number(workLat).toFixed(5)} • Lng: {Number(workLng).toFixed(5)}</div>
              </div>
              <MapPicker
                lat={workLat}
                lng={workLng}
                onLocationChange={(lat, lng) => { setWorkLat(lat); setWorkLng(lng) }}
              />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useSameContact"
                checked={useSameContact}
                onChange={(e) => setUseSameContact(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useSameContact" className="text-sm font-medium">
                Use same phone and email as above for contact
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone <span className="text-red-500">*</span></label>
              <PhoneInput
                className="phone-input"
                value={contactPhone}
                onChange={setContactPhone}
                defaultCountry="IN"
                placeholder="Phone for citizens to contact you"
                inputClassName="w-full rounded-lg bg-white/90 text-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={useSameContact}
              />
              {contactPhone && (
                <div className="text-xs mt-1">
                  <span className={isValidPhone(contactPhone) ? 'text-green-600' : 'text-red-600'}>
                    {isValidPhone(contactPhone) ? '✓ Valid contact number' : '✗ Invalid contact number'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input
                className="w-full rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                type="email"
                value={contactEmail}
                onChange={(e)=>setContactEmail(e.target.value)}
                placeholder="Email for citizens to contact you"
                disabled={useSameContact}
              />
            </div>
          </>
        )}
        <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition">{loading? 'Creating...' : 'Create account'}</button>
        <p className="text-white/80 text-sm">Have an account? <Link to="/login" className="underline">Sign in</Link></p>
      </form>
    </AuthLayout>
  )
}
