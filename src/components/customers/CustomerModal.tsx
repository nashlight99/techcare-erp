'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const TAGS = ['premium', 'repair_client', 'buyer', 'vip', 'pro']
const SUBSCRIPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: 'high_tech_care', label: 'High-Tech Care' },
  { value: 'premium', label: 'Premium' },
]

interface Props { customer?: any; onClose: () => void; onSaved: () => void }

export function CustomerModal({ customer, onClose, onSaved }: Props) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState({
    first_name: customer?.first_name ?? '',
    last_name: customer?.last_name ?? '',
    phone: customer?.phone ?? '',
    whatsapp_available: customer?.whatsapp_available ?? false,
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    tags: customer?.tags ?? [] as string[],
    subscription_status: customer?.subscription_status ?? 'none',
    notes: customer?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleTag = (tag: string) => set('tags', form.tags.includes(tag) ? form.tags.filter((t: string) => t !== tag) : [...form.tags, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/customers/${customer.id}` : '/api/customers'
      const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!r.ok) throw new Error(await r.text())
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Prénom</label><input className="input" placeholder="Jean" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
              <div><label className="label">Nom</label><input className="input" placeholder="Dupont" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
            </div>
            <div>
              <label className="label">Téléphone</label>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="+33 6 12 34 56 78" value={form.phone} onChange={e => set('phone', e.target.value)} />
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm text-gray-600 whitespace-nowrap">
                  <input type="checkbox" checked={form.whatsapp_available} onChange={e => set('whatsapp_available', e.target.checked)} className="accent-green-600" />WhatsApp
                </label>
              </div>
            </div>
            <div><label className="label">Email</label><input className="input" type="email" placeholder="jean@example.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Adresse</label><input className="input" placeholder="12 rue..." value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.tags.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>{tag}</button>
                ))}
              </div>
            </div>
            <div><label className="label">Abonnement</label>
              <select className="input" value={form.subscription_status} onChange={e => set('subscription_status', e.target.value)}>
                {SUBSCRIPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="label">Notes internes</label><textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
