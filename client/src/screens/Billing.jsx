import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import api from '../api/client'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    highlight: 'Basic usability with deliberate friction.',
    features: [
      'Max 2 complaints/day per resident',
      'Manual assignment only',
      'No SLA timers / no automation',
      'No priority queues',
      'No staff analytics',
    ],
  },
  {
    id: 'god',
    name: 'God Mode (Pro)',
    price: '$— (prototype)',
    highlight: 'Operational powerhouse for teams who need throughput.',
    features: [
      'Unlimited complaints',
      'Auto-assignment + smart filters',
      'SLA timers + nudges',
      'Department & zone analytics',
      'Role-based access + automation hooks',
    ],
  },
  {
    id: 'titan',
    name: 'Titan Mode',
    price: '$— (prototype)',
    highlight: 'Priority handling, advanced automation, enterprise-like power.',
    features: [
      'Priority queues & faster SLA',
      'Auto-escalation on breach',
      'AI triage / load balancing',
      'Advanced analytics',
      'Dedicated CSM (prototype)',
    ],
  },
]

export default function Billing() {
  const { user, setUser } = useAuth()
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const orgId = user?.organization?.id
  const mailto = 'mailto:sales@example.com?subject=Plan%20change&body=Please%20change%20our%20plan.'
  const isAdmin = user?.role === 'admin'

  const applyPlan = async (planId) => {
    if (!isAdmin || !orgId) {
      window.location.href = mailto
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const { data } = await api.patch(`/api/orgs/${orgId}/plan`, { plan: planId })
      if (data?.organization) {
        setUser({ ...user, organization: data.organization })
        setMessage(`Plan updated to ${data.organization.plan.toUpperCase()} (prototype).`)
      }
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to change plan, please email sales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Billing (Prototype)</h1>
        <p className="text-sm text-gray-600">Select a plan to simulate upgrading/downgrading. Payments are not wired; admins can change plan directly or contact sales.</p>
      </div>
      {message && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-emerald-800 text-sm">{message}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map(plan => (
          <div key={plan.id} className={`rounded-xl border ${plan.id === selected ? 'border-emerald-600' : 'border-gray-200'} bg-white shadow-sm p-4 flex flex-col gap-3`}>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-gray-500">{plan.id === user?.organization?.plan ? 'Current plan' : 'Available'}</div>
              <div className="text-xl font-semibold">{plan.name}</div>
              <div className="text-emerald-700 font-semibold">{plan.price}</div>
              <div className="text-sm text-gray-700">{plan.highlight}</div>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              {plan.features.map(f => <li key={f}>• {f}</li>)}
            </ul>
            <div className="mt-auto space-y-2">
              <button
                onClick={() => setSelected(plan.id)}
                className="w-full px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
              >
                View selection
              </button>
              <button
                disabled={loading}
                onClick={() => applyPlan(plan.id)}
                className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {loading && selected === plan.id ? 'Applying…' : 'Apply plan (prototype)'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-600">
        Payments are not integrated. Use the buttons above to prototype plan changes or email sales.
      </div>
    </div>
  )
}


