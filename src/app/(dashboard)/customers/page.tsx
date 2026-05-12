'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Phone, Mail, ChevronRight } from 'lucide-react'
import { CustomerModal } from '@/components/customers/CustomerModal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ ...(search && { search }), limit: '30' })
    const r = await fetch(`/api/customers?${params}`)
    const d = await r.json()
    setCustomers(d.data ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(t)
  }, [fetchCustomers])

  const handleSaved = () => {
    setShowModal(false)
    setSelected(null)
    fetchCustomers()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} client{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setSelected(null); setShowModal(true) }} className="btn-primary">
          <Plus size={16} />Nouveau client
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input type="text" className="input pl-9" placeholder="Nom, téléphone, email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded w-36" />
                  <div className="h-3 bg-gray-100 rounded w-52" />
                </div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">Aucun client trouvé</p>
            <button onClick={() => { setSelected(null); setShowModal(true) }} className="mt-3 text-sm text-blue-600 hover:underline">Créer le premier client</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {customers.map((c: any) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => { setSelected(c); setShowModal(true) }}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                  {((c.first_name?.[0] ?? '') + (c.last_name?.[0] ?? '')).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {c.first_name ?? ''} {c.last_name ?? ''}
                    {!c.first_name && !c.last_name && <span className="text-gray-400">Sans nom</span>}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    {c.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} />{c.phone}{c.whatsapp_available && <span className="text-green-600 font-medium ml-1">WA</span>}</span>}
                    {c.email && <span className="text-xs text-gray-500 flex items-center gap-1 truncate"><Mail size={11} />{c.email}</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <CustomerModal customer={selected} onClose={() => { setShowModal(false); setSelected(null) }} onSaved={handleSaved} />}
    </div>
  )
}
