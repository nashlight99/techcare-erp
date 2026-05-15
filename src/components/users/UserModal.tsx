'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'
import type { Store, User } from '@/types'

const ROLES = Object.entries(ROLE_LABELS) as [string, string][]

interface Props {
  user?: User | null
  onClose: () => void
  onSaved: () => void
}

export function UserModal({ user, onClose, onSaved }: Props) {
  const isEdit = !!user?.id
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'employee',
    store_id: user?.store_id ?? '',
  })
  const [stores, setStores] = useState<Store[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email) { setError('Nom et email requis'); return }
    if (!isEdit && !form.password) { setError('Mot de passe requis pour un nouvel utilisateur'); return }
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/users/${user.id}` : '/api/users'
      const body: Record<string, any> = { ...form, store_id: form.store_id || null }
      if (!form.password) delete body.password
      const r = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? 'Erreur serveur') }
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nom complet <span className="text-red-500">*</span></label>
            <input className="input" placeholder="Jean Dupont" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
          </div>

          <div>
            <label className="label">Adresse email <span className="text-red-500">*</span></label>
            <input className="input" type="email" placeholder="jean@techcare.fr" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          <div>
            <label className="label">
              Mot de passe {isEdit && <span className="text-gray-400 font-normal">(laisser vide pour ne pas changer)</span>}
              {!isEdit && <span className="text-red-500"> *</span>}
            </label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPassword ? 'text' : 'password'}
                placeholder={isEdit ? '••••••••' : 'Minimum 8 caractères'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rôle</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Boutique</label>
              <select className="input" value={form.store_id} onChange={e => set('store_id', e.target.value)}>
                <option value="">Toutes</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
