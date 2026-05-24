'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import { RepairModal } from '@/components/repairs/RepairModal'
import { STATUS_COLORS, STATUS_LABELS, STATUSES } from '@/lib/constants'
import { useActiveStore } from '@/contexts/store'
import type { Repair } from '@/types'

export default function InterventionsPage() {
  const activeStore = useActiveStore()
  const [tickets, setTickets] = useState<Repair[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(filterStatus && { status: filterStatus }),
      ...(activeStore && { storeId: activeStore.id }),
      limit: '40',
    })
    const r = await fetch(`/api/repairs?${params}`)
    const d = await r.json()
    setTickets(d.data ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [search, filterStatus, activeStore])

  useEffect(() => {
    const t = setTimeout(fetchTickets, 300)
    return () => clearTimeout(t)
  }, [fetchTickets])

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/repairs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTickets()
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Interventions</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} intervention{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setSelected(null); setShowModal(true) }}
          className="btn-primary"
        >
          <Plus size={16} />Nouvelle intervention
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input pl-9"
            placeholder="Numéro, client, appareil..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex gap-4">
                <div className="w-24 h-4 bg-gray-100 rounded" />
                <div className="flex-1 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-2">Aucune intervention trouvée</p>
            {!search && !filterStatus && (
              <button
                onClick={() => { setSelected(null); setShowModal(true) }}
                className="text-sm text-blue-600 hover:underline"
              >
                Créer la première intervention
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['N° Ticket', 'Client', 'Appareil', 'Statut', 'Date', 'Changer statut'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <Link
                          href={`/interventions/${t.id}`}
                          className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {t.ticket_number}
                          <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {t.customers?.first_name} {t.customers?.last_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t.device_brand} {t.device_model}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(t.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={t.status}
                          onChange={e => handleStatusChange(t.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                        >
                          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {tickets.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/interventions/${t.id}`}
                  className="block px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-blue-600">{t.ticket_number}</span>
                    <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {t.customers?.first_name} {t.customers?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{t.device_brand} {t.device_model}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <RepairModal
          ticket={selected}
          onClose={() => { setShowModal(false); setSelected(null) }}
          onSaved={() => { setShowModal(false); setSelected(null); fetchTickets() }}
        />
      )}
    </div>
  )
}
