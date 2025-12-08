import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/departments')
        setDepartments(data.departments || [])
      } catch {
        setDepartments([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">All Departments</h1>
      <p className="text-fade">Browse all available departments and their handled categories.</p>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => (
            <div key={d._id} className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold text-lg">{d.name}</h3>
              <p className="text-xs text-fade">Code: {d.code}</p>
              <div className="mt-2">
                <p className="text-xs text-fade mb-1">Handles:</p>
                <div className="flex flex-wrap gap-1">
                  {(d.categoriesHandled || []).map((cat, i) => (
                    <span key={i} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">{cat}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

