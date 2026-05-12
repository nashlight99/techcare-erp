'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { RepairModal } from '@/components/repairs/RepairModal'

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_parts: 'bg-yellow-100 text-yellow-700',
  waiting_customer: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu', in_progress: 'En cours', waiting_parts: 'Attente pièces',
  waiting_customer: 'Attente client', completed: 'Terminé', cancelled: 'Annulé',
}
const STATUSES = Object.entries(STATUS_LABELS)

export default function RepairsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ ...(search && { search }), ...(filterStatus && { status: filterStatus }), limit: '40' })
    const r = await fetch(`/api/repairs?${params}`)
    const d = await r.json()
    setTickets(d.data ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => {
    const t = setTimeout(fetchTickets, 300)
    return () => clearTimeout(t)
  }, [fetchTickets])

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/repairs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    fetchTickets()
  }

  const handleSaved = () => { setShowModal(false); setSelected(null); fetchTickets() }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Réparations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} ticket{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setSelected(null); setShowModal(true) }} className="btn-primary"><Plus size={16} />Nouveau ticket</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input pl-9" placeholder="Ticket, client, appareil..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 animate-pulse flex gap-4"><div className="w-24 h-4 bg-gray-100 rounded" /><div className="flex-1 h-4 bg-gray-100 rounded" /></div>)}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center"><p className="text-sm text-gray-400">Aucun ticket trouvé</p></div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{['Ticket','Client','Appareil','Statut','Date','Action'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{t.ticket_number}</td>
                      <td className="px-4 py-3 text-gray-900">{t.customers?.first_name} {t.customers?.last_name}</td>
                      <td className="px-4 py-3 text-gray-600">{t.device_brand} {t.device_model}</td>
                      <td className="px-4 py-3"><span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <select value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none">
                          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {tickets.map((t: any) => (
                <div key={t.id} className="px-4 py-4 cursor-pointer" onClick={() => { setSelected(t); setShowModal(true) }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-blue-600">{t.ticket_number}</span>
                    <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{t.customers?.first_name} {t.customers?.last_name}</p>
                  <p className="text-xs text-gray-500">{t.device_brand} {t.device_model}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {showModal && <RepairModal ticket={selected} onClose={() => { setShowModal(false); setSelected(null) }} onSaved={handleSaved} />}
    </div>
  )
}
