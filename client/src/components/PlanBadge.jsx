const COLORS = {
  free: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  god: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  titan: 'bg-purple-100 text-purple-800 border border-purple-200',
}

const LABELS = {
  free: 'Gold',
  god: 'Platinum',
  titan: 'Titanium',
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
