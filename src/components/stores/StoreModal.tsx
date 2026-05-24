'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Store } from '@/types'

interface Props {
  store: Store | null
  onClose: () => void
  onSaved: () => void
}

export function StoreModal({ store, onClose, onSaved }: Props) {
  const isEdit = !!store?.id
  const [form, setForm] = useState({
    name:    store?.name    ?? '',
    address: store?.address ?? '',
    phone:   store?.phone   ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return }
    setError('')
    setLoading(true)
    try {
      const url    = isEdit ? `/api/stores/${store!.id}` : '/api/stores'
      const method = isEdit ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erreur lors de la sauvegarde')
      }
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Modifier la boutique' : 'Nouvelle boutique'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nom <span className="text-red-500">*</span></label>
            <input
              className="input"
              placeholder="TechCare Paris 11"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Adresse</label>
            <input
              className="input"
              placeholder="12 rue de la Paix, 75001 Paris"
              value={form.address}
              onChange={e => set('address', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input
              className="input"
              placeholder="+33 1 23 45 67 89"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
