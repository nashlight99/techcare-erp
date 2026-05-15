'use client'
import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Store } from '@/types'

const CATEGORIES = ['Écrans', 'Batteries', 'Connecteurs', 'Caméras', 'Haut-parleurs', 'Châssis', 'Accessoires', 'Autre']

interface InventoryItem {
  id?: string
  name: string
  sku?: string | null
  category?: string | null
  quantity: number
  low_stock_threshold: number
  cost_price?: number | null
  sell_price?: number | null
  store_id?: string | null
}

interface Props {
  item?: InventoryItem | null
  onClose: () => void
  onSaved: () => void
}

export function InventoryModal({ item, onClose, onSaved }: Props) {
  const isEdit = !!item?.id
  const [form, setForm] = useState({
    name:                item?.name ?? '',
    sku:                 item?.sku ?? '',
    category:            item?.category ?? '',
    quantity:            item?.quantity ?? 0,
    low_stock_threshold: item?.low_stock_threshold ?? 5,
    cost_price:          item?.cost_price ?? '',
    sell_price:          item?.sell_price ?? '',
    store_id:            item?.store_id ?? '',
  })
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/inventory/${item!.id}` : '/api/inventory'
      const r = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity:            Number(form.quantity) || 0,
          low_stock_threshold: Number(form.low_stock_threshold) || 5,
          cost_price:          form.cost_price !== '' ? Number(form.cost_price) : null,
          sell_price:          form.sell_price !== '' ? Number(form.sell_price) : null,
          store_id:            form.store_id || null,
        }),
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Modifier l'article" : 'Nouvel article'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="label">Nom <span className="text-red-500">*</span></label>
              <input className="input" placeholder="Écran iPhone 14 Pro..." value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Référence (SKU)</label>
                <input className="input font-mono text-xs" placeholder="ECR-IP14P-01" value={form.sku} onChange={e => set('sku', e.target.value)} />
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantité en stock</label>
                <input className="input" type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
              </div>
              <div>
                <label className="label">Seuil d'alerte</label>
                <input className="input" type="number" min="0" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prix d'achat (€)</label>
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} />
              </div>
              <div>
                <label className="label">Prix de vente (€)</label>
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.sell_price} onChange={e => set('sell_price', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Boutique</label>
              <select className="input" value={form.store_id} onChange={e => set('store_id', e.target.value)}>
                <option value="">Toutes les boutiques</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : "Ajouter l'article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
