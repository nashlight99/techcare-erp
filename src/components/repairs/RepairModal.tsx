'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Search, UserPlus, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

const STATUSES = Object.entries(STATUS_LABELS)

interface Props { ticket?: any; onClose: () => void; onSaved: (created?: any) => void }

const EMPTY_NEW_CUSTOMER = { first_name: '', last_name: '', phone: '', email: '', whatsapp_available: false }

export function RepairModal({ ticket, onClose, onSaved }: Props) {
  const isEdit = !!ticket?.id
  const [form, setForm] = useState({
    customer_id:      ticket?.customer_id      ?? '',
    store_id:         ticket?.store_id         ?? '',
    assigned_user_id: ticket?.assigned_user_id ?? '',
    device_brand:     ticket?.device_brand     ?? '',
    device_model:     ticket?.device_model     ?? '',
    serial_number:    ticket?.serial_number    ?? '',
    imei:             ticket?.imei             ?? '',
    issue_description:ticket?.issue_description?? '',
    status:           ticket?.status           ?? 'received',
    estimated_cost:   ticket?.estimated_cost   ?? '',
    final_cost:       ticket?.final_cost       ?? '',
    internal_notes:   ticket?.internal_notes   ?? '',
  })

  const [customerSearch, setCustomerSearch]     = useState(ticket ? `${ticket.customers?.first_name ?? ''} ${ticket.customers?.last_name ?? ''}`.trim() : '')
  const [customerResults, setCustomerResults]   = useState<any[]>([])
  const [searching, setSearching]               = useState(false)
  const [searchDone, setSearchDone]             = useState(false)
  const [showNewCustomer, setShowNewCustomer]   = useState(false)
  const [newCustomer, setNewCustomer]           = useState(EMPTY_NEW_CUSTOMER)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [createdCustomerName, setCreatedCustomerName] = useState('')

  const [stores, setStores] = useState<any[]>([])
  const [users,  setUsers]  = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {})
    fetch('/api/users').then(r  => r.json()).then(setUsers).catch(() => {})
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCustomerResults([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([])
      setSearchDone(false)
      setSearching(false)
      return
    }
    if (form.customer_id) return
    setSearchDone(false)
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&limit=6`)
        const d = await r.json()
        setCustomerResults(d.data ?? [])
      } finally {
        setSearching(false)
        setSearchDone(true)
      }
    }, 250)
    return () => { clearTimeout(t); setSearching(false) }
  }, [customerSearch, form.customer_id])

  // Pre-fill new customer form from search text
  const openNewCustomer = () => {
    const parts = customerSearch.trim().split(' ')
    setNewCustomer({
      ...EMPTY_NEW_CUSTOMER,
      first_name: parts[0] ?? '',
      last_name:  parts.slice(1).join(' ') ?? '',
    })
    setShowNewCustomer(true)
    setCustomerResults([])
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.first_name.trim()) return
    setCreatingCustomer(true)
    try {
      const r = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name:          newCustomer.first_name.trim(),
          last_name:           newCustomer.last_name.trim() || null,
          phone:               newCustomer.phone.trim()     || null,
          email:               newCustomer.email.trim()     || null,
          whatsapp_available:  newCustomer.whatsapp_available,
        }),
      })
      if (!r.ok) throw new Error('Erreur lors de la création du client')
      const data = await r.json()
      const fullName = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      setForm(f => ({ ...f, customer_id: data.id }))
      setCustomerSearch(fullName)
      setCreatedCustomerName(fullName)
      setShowNewCustomer(false)
      setNewCustomer(EMPTY_NEW_CUSTOMER)
    } catch {
      // silently ignore — user can retry
    } finally {
      setCreatingCustomer(false)
    }
  }

  const set  = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setNC = (k: keyof typeof EMPTY_NEW_CUSTOMER, v: any) => setNewCustomer(n => ({ ...n, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id)      { setError('Veuillez sélectionner ou créer un client'); return }
    if (!form.issue_description){ setError('La description du problème est requise');   return }
    setError('')
    setLoading(true)
    try {
      const url    = isEdit ? `/api/repairs/${ticket.id}` : '/api/repairs'
      const method = isEdit ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      onSaved(data)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  const noResults = searchDone && customerResults.length === 0 && !form.customer_id && customerSearch.length >= 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? `Ticket ${ticket.ticket_number}` : 'Nouvelle intervention'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">

            {/* Customer search */}
            <div ref={dropdownRef} className="relative">
              <label className="label">Client <span className="text-red-500">*</span></label>
              <div className="relative">
                {searching
                  ? <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin pointer-events-none" />
                  : <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                }
                <input
                  className="input pl-9"
                  placeholder="Rechercher un client existant..."
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value)
                    set('customer_id', '')
                    setCreatedCustomerName('')
                    setShowNewCustomer(false)
                  }}
                />
              </div>
              {/* Searching hint */}
              {searching && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  Recherche en cours…
                </p>
              )}

              {/* Results dropdown */}
              {customerResults.length > 0 && !form.customer_id && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                  {customerResults.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        set('customer_id', c.id)
                        setCustomerSearch(`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim())
                        setCustomerResults([])
                        setCreatedCustomerName('')
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium text-gray-900">{c.first_name} {c.last_name}</span>
                      {c.phone && <span className="text-gray-400 ml-2 text-xs">{c.phone}</span>}
                      {c.email && <span className="text-gray-400 ml-2 text-xs">{c.email}</span>}
                    </button>
                  ))}
                  {/* Always offer to create even when results exist */}
                  <button
                    type="button"
                    onClick={openNewCustomer}
                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    <UserPlus size={14} />
                    Créer un nouveau client
                  </button>
                </div>
              )}

              {/* No results state */}
              {noResults && !showNewCustomer && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">
                    Aucun client trouvé pour <span className="font-medium text-gray-700">"{customerSearch}"</span>
                  </p>
                  <button
                    type="button"
                    onClick={openNewCustomer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    <UserPlus size={13} />
                    Créer ce client
                  </button>
                </div>
              )}

              {/* Selected confirmation */}
              {form.customer_id && !createdCustomerName && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Client sélectionné
                </p>
              )}
              {createdCustomerName && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Nouveau client créé : <span className="font-semibold">{createdCustomerName}</span>
                </p>
              )}
            </div>

            {/* Inline new customer form */}
            {showNewCustomer && (
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus size={15} className="text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">Nouveau client</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="p-1 rounded text-blue-400 hover:text-blue-700"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Prénom <span className="text-red-500">*</span></label>
                    <input
                      className="input bg-white"
                      placeholder="Jean"
                      value={newCustomer.first_name}
                      onChange={e => setNC('first_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Nom</label>
                    <input
                      className="input bg-white"
                      placeholder="Dupont"
                      value={newCustomer.last_name}
                      onChange={e => setNC('last_name', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Téléphone</label>
                    <input
                      className="input bg-white"
                      placeholder="+33 6 00 00 00 00"
                      value={newCustomer.phone}
                      onChange={e => setNC('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input bg-white"
                      type="email"
                      placeholder="jean@email.com"
                      value={newCustomer.email}
                      onChange={e => setNC('email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setNC('whatsapp_available', !newCustomer.whatsapp_available)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${newCustomer.whatsapp_available ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${newCustomer.whatsapp_available ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-700">WhatsApp disponible</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={creatingCustomer || !newCustomer.first_name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingCustomer
                      ? <Loader2 size={14} className="animate-spin" />
                      : <UserPlus size={14} />
                    }
                    Créer et sélectionner
                  </button>
                </div>
              </div>
            )}

            {/* Store + Technician */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Boutique</label>
                <select className="input" value={form.store_id} onChange={e => set('store_id', e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Technicien</label>
                <select className="input" value={form.assigned_user_id} onChange={e => set('assigned_user_id', e.target.value)}>
                  <option value="">Non assigné</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            </div>

            {/* Device */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Marque</label>
                <input className="input" placeholder="Apple, Samsung..." value={form.device_brand} onChange={e => set('device_brand', e.target.value)} />
              </div>
              <div>
                <label className="label">Modèle</label>
                <input className="input" placeholder="iPhone 15..." value={form.device_model} onChange={e => set('device_model', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Numéro de série</label>
                <input className="input font-mono text-xs" placeholder="SN..." value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
              </div>
              <div>
                <label className="label">IMEI</label>
                <input className="input font-mono text-xs" placeholder="35..." value={form.imei} onChange={e => set('imei', e.target.value)} />
              </div>
            </div>

            {/* Issue */}
            <div>
              <label className="label">Description du problème <span className="text-red-500">*</span></label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Décrivez le problème..."
                value={form.issue_description}
                onChange={e => set('issue_description', e.target.value)}
              />
            </div>

            {/* Status + Costs */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Statut</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Devis (€ HT)</label>
                <input className="input" type="number" step="0.01" placeholder="0.00" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} />
              </div>
              <div>
                <label className="label">Prix final (€ HT)</label>
                <input className="input" type="number" step="0.01" placeholder="0.00" value={form.final_cost} onChange={e => set('final_cost', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Notes internes</label>
              <textarea className="input resize-none" rows={2} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
            </div>

            {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer l\'intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
