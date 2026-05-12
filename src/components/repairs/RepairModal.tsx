'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Search } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

const STATUSES = Object.entries(STATUS_LABELS)

interface Props { ticket?: any; onClose: () => void; onSaved: () => void }

export function RepairModal({ ticket, onClose, onSaved }: Props) {
  const isEdit = !!ticket?.id
  const [form, setForm] = useState({
    customer_id: ticket?.customer_id ?? '',
    store_id: ticket?.store_id ?? '',
    assigned_user_id: ticket?.assigned_user_id ?? '',
    device_brand: ticket?.device_brand ?? '',
    device_model: ticket?.device_model ?? '',
    serial_number: ticket?.serial_number ?? '',
    imei: ticket?.imei ?? '',
    issue_description: ticket?.issue_description ?? '',
    status: ticket?.status ?? 'received',
    estimated_cost: ticket?.estimated_cost ?? '',
    final_cost: ticket?.final_cost ?? '',
    internal_notes: ticket?.internal_notes ?? '',
  })
  const [customerSearch, setCustomerSearch] = useState(ticket ? `${ticket.customers?.first_name ?? ''} ${ticket.customers?.last_name ?? ''}`.trim() : '')
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {})
    fetch('/api/users').then(r => r.json()).then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&limit=5`)
      const d = await r.json()
      setCustomerResults(d.data ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id) { setError('Veuillez sélectionner un client'); return }
    if (!form.issue_description) { setError('La description du problème est requise'); return }
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/repairs/${ticket.id}` : '/api/repairs'
      const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!r.ok) throw new Error(await r.text())
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? `Ticket ${ticket.ticket_number}` : 'Nouveau ticket de réparation'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            <div className="relative">
              <label className="label">Client <span className="text-red-500">*</span></label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input className="input pl-9" placeholder="Rechercher un client..." value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); set('customer_id', '') }} />
              </div>
              {customerResults.length > 0 && !form.customer_id && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                  {customerResults.map((c: any) => (
                    <button key={c.id} type="button" onClick={() => { set('customer_id', c.id); setCustomerSearch(`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()); setCustomerResults([]) }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">
                      <span className="font-medium">{c.first_name} {c.last_name}</span>{c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
              {form.customer_id && <p className="text-xs text-green-600 mt-1">✓ Client sélectionné</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Boutique</label>
                <select className="input" value={form.store_id} onChange={e => set('store_id', e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="label">Technicien</label>
                <select className="input" value={form.assigned_user_id} onChange={e => set('assigned_user_id', e.target.value)}>
                  <option value="">Non assigné</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Marque</label><input className="input" placeholder="Apple, Samsung..." value={form.device_brand} onChange={e => set('device_brand', e.target.value)} /></div>
              <div><label className="label">Modèle</label><input className="input" placeholder="iPhone 15..." value={form.device_model} onChange={e => set('device_model', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Numéro de série</label><input className="input font-mono text-xs" placeholder="SN..." value={form.serial_number} onChange={e => set('serial_number', e.target.value)} /></div>
              <div><label className="label">IMEI</label><input className="input font-mono text-xs" placeholder="35..." value={form.imei} onChange={e => set('imei', e.target.value)} /></div>
            </div>
            <div><label className="label">Description du problème <span className="text-red-500">*</span></label>
              <textarea className="input resize-none" rows={3} placeholder="Décrivez le problème..." value={form.issue_description} onChange={e => set('issue_description', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Statut</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div><label className="label">Devis (€)</label><input className="input" type="number" step="0.01" placeholder="0.00" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} /></div>
              <div><label className="label">Prix final (€)</label><input className="input" type="number" step="0.01" placeholder="0.00" value={form.final_cost} onChange={e => set('final_cost', e.target.value)} /></div>
            </div>
            <div><label className="label">Notes internes</label><textarea className="input resize-none" rows={2} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} /></div>
            {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer le ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
