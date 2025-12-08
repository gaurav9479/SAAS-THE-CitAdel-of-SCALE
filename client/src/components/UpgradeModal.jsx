import { useNavigate } from 'react-router-dom'

export default function UpgradeModal({ open, onClose, mailto = 'mailto:sales@example.com', title = 'Upgrade your plan' }) {
  const navigate = useNavigate()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">Pick how you want to upgrade. Billing portal is simulated for now.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => { window.location.href = mailto }}
            className="w-full px-4 py-3 rounded-lg border border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
          >
            Email platform owner
          </button>
          <button
            onClick={() => { onClose(); navigate('/billing') }}
            className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Go to billing page (prototype)
          </button>
        </div>
      </div>
    </div>
  )
}


