import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import PhoneInput from 'react-phone-number-input'
import { parsePhoneNumber } from 'libphonenumber-js'
import 'react-phone-number-input/style.css'

export default function ProfileEdit() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    workArea: { city: '', zones: [] },
    isWorkingToday: true,
    contactPhone: '',
    contactEmail: '',
    skills: [],
    title: '',
    shiftStart: '',
    shiftEnd: '',
  })

  // Phone validation
  const isValidPhone = (phone) => {
    if (!phone) return null
    try {
      const phoneNumber = parsePhoneNumber(phone)
      return phoneNumber ? phoneNumber.isValid() : false
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.profile?.phone || '',
        workArea: {
          city: user.staff?.workArea?.city || '',
          zones: user.staff?.workArea?.zones || [],
        },
        isWorkingToday: user.staff?.isWorkingToday ?? true,
        contactPhone: user.staff?.contactPhone || '',
        contactEmail: user.staff?.contactEmail || '',
        skills: user.staff?.skills || [],
        title: user.staff?.title || '',
        shiftStart: user.staff?.shiftStart || '',
        shiftEnd: user.staff?.shiftEnd || '',
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate phone numbers if provided
    if (formData.phone && !isValidPhone(formData.phone)) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }

    if (user.role === 'staff' && formData.contactPhone && !isValidPhone(formData.contactPhone)) {
      setError('Please enter a valid contact phone number')
      setLoading(false)
      return
    }

    try {
      const { data } = await api.patch('/api/users/profile', formData)
      setUser(data.user)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(s => s.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, [field]: array }))
  }

  if (!user) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit Profile</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {user.role === 'admin' && user.organization && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
          <div className="font-semibold text-emerald-800">Share your organization code</div>
          <div className="mt-1 flex items-center gap-2">
            <code className="px-2 py-1 rounded bg-white border border-emerald-200 text-emerald-800">
              {user.organization.code || 'N/A'}
            </code>
            <button
              type="button"
              onClick={() => { if (user.organization.code) navigator.clipboard.writeText(user.organization.code) }}
              className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
              disabled={!user.organization.code}
            >
              Copy
            </button>
            <span className="text-xs text-emerald-700">Give this code to staff/citizens to join your org.</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl p-4 shadow space-y-4">
          <h2 className="text-lg font-medium">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full border rounded p-2"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <PhoneInput
              className="phone-input"
              value={formData.phone}
              onChange={(value) => handleChange('phone', value)}
              defaultCountry="IN"
              placeholder="Enter phone number"
              inputClassName="w-full border rounded p-2"
            />
            {formData.phone && (
              <div className="text-xs mt-1">
                <span className={isValidPhone(formData.phone) ? 'text-green-600' : 'text-red-600'}>
                  {isValidPhone(formData.phone) ? '✓ Valid phone number' : '✗ Invalid phone number'}
                </span>
              </div>
            )}
          </div>
        </div>

        {user.role === 'staff' && (
          <div className="bg-white rounded-xl p-4 shadow space-y-4">
            <h2 className="text-lg font-medium">Work Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="w-full border rounded p-2"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Field Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
              <input
                className="w-full border rounded p-2"
                value={formData.skills.join(', ')}
                onChange={(e) => handleArrayChange('skills', e.target.value)}
                placeholder="e.g., plumbing, electrical, maintenance"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Shift Start</label>
                <input
                  type="time"
                  className="w-full border rounded p-2"
                  value={formData.shiftStart}
                  onChange={(e) => handleChange('shiftStart', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shift End</label>
                <input
                  type="time"
                  className="w-full border rounded p-2"
                  value={formData.shiftEnd}
                  onChange={(e) => handleChange('shiftEnd', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isWorkingToday"
                checked={formData.isWorkingToday}
                onChange={(e) => handleChange('isWorkingToday', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isWorkingToday" className="text-sm font-medium">Working today</label>
            </div>
          </div>
        )}

        {user.role === 'staff' && (
          <div className="bg-white rounded-xl p-4 shadow space-y-4">
            <h2 className="text-lg font-medium">Work Area</h2>
            <div>
              <label className="block text-sm font-medium mb-1">City/Area</label>
              <input
                className="w-full border rounded p-2"
                value={formData.workArea.city}
                onChange={(e) => handleChange('workArea.city', e.target.value)}
                placeholder="e.g., New York, Manhattan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zones (comma-separated)</label>
              <input
                className="w-full border rounded p-2"
                value={formData.workArea.zones.join(', ')}
                onChange={(e) => handleArrayChange('workArea.zones', e.target.value)}
                placeholder="e.g., Zone A, North District, Downtown"
              />
            </div>
          </div>
        )}

        {user.role === 'staff' && (
          <div className="bg-white rounded-xl p-4 shadow space-y-4">
            <h2 className="text-lg font-medium">Contact Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone</label>
              <PhoneInput
                className="phone-input"
                value={formData.contactPhone}
                onChange={(value) => handleChange('contactPhone', value)}
                defaultCountry="IN"
                placeholder="Phone for citizens to contact you"
                inputClassName="w-full border rounded p-2"
              />
              {formData.contactPhone && (
                <div className="text-xs mt-1">
                  <span className={isValidPhone(formData.contactPhone) ? 'text-green-600' : 'text-red-600'}>
                    {isValidPhone(formData.contactPhone) ? '✓ Valid contact number' : '✗ Invalid contact number'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input
                type="email"
                className="w-full border rounded p-2"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="Email for citizens to contact you"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
