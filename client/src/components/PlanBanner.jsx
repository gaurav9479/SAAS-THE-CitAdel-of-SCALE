import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import api from '../api/client'
import UpgradeModal from './UpgradeModal'

const PLAN_COPY = {
  free: {
    label: 'Free Tier',
    desc: 'Manual assignment, no SLA, 2 complaints/day. Upgrade to unlock automation.',
    cta: 'Upgrade to God Mode',
    next: 'god',
  },
  god: {
    label: 'God Mode (Pro)',
    desc: 'Automation, SLA timers, analytics. Upgrade for priority routing.',
    cta: 'Upgrade to Titan',
    next: 'titan',
  },
  titan: {
    label: 'Titan Mode',
    desc: 'Priority queues, faster SLA, auto-escalation, advanced automation.',
    cta: 'Contact Sales',
    next: null,
  },
}

export default function PlanBanner() {
  const { user, setUser } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const plan = user?.organization?.plan || 'free'
  const orgId = user?.organization?.id
  const copy = PLAN_COPY[plan] || PLAN_COPY.free
  const mailto = 'mailto:sales@example.com?subject=Upgrade%20to%20Titan&body=Please%20upgrade%20our%20org.'

  const onUpgrade = async () => {
    // Only admins should call the API; others fall back to email CTA
    const isAdmin = user?.role === 'admin'
    if (!copy.next || !orgId || !isAdmin) {
      window.location.href = mailto
      return
    }
    try {
      const { data } = await api.patch(`/api/orgs/${orgId}/plan`, { plan: copy.next })
      if (data?.organization) {
        setUser({
          ...user,
          organization: data.organization,
        })
      }
    } catch (_e) {
      window.location.href = mailto
    }
  }

  return (
    <>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">{user?.organization?.name || 'Organization'}</div>
          <div className="text-lg font-semibold text-emerald-900">{copy.label}</div>
          <div className="text-sm text-emerald-800">{copy.desc}</div>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
          >
            {copy.cta}
          </button>
          <a
            href={mailto}
            className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition"
          >
            Talk to Sales
          </a>
        </div>
      </div>
      <UpgradeModal open={modalOpen} onClose={() => setModalOpen(false)} mailto={mailto} title="Upgrade or simulate billing" />
    </>
  )
}


