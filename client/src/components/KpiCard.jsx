export default function KpiCard({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white/80 dark:bg-[#1F2937]/60 backdrop-blur p-4 shadow">
      <div className="text-fade text-sm">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-fade mt-1">{sub}</div>}
    </div>
  )
}
