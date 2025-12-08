const COLORS = {
  free: 'bg-gray-200 text-gray-800 border border-gray-300',
  god: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  titan: 'bg-purple-100 text-purple-800 border border-purple-200',
}

export default function PlanBadge({ plan = 'free' }) {
  const cls = COLORS[plan] || COLORS.free
  const label = plan === 'god' ? 'God Mode' : plan === 'titan' ? 'Titan' : 'Free'
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
      {label}
    </span>
  )
}

const COLORS = {
  free: 'bg-gray-200 text-gray-800 border border-gray-300',
  god: 'bg-amber-100 text-amber-800 border border-amber-200',
  titan: 'bg-purple-100 text-purple-800 border border-purple-200',
}

const LABELS = {
  free: 'Free',
  god: 'God',
  titan: 'Titan',
}

export default function PlanBadge({ plan = 'free' }) {
  const cls = COLORS[plan] || COLORS.free
  const label = LABELS[plan] || 'Free'
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label} Plan
    </span>
  )
}


