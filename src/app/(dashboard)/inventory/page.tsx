'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, AlertTriangle, Pencil, Trash2, Package } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { InventoryModal } from '@/components/inventory/InventoryModal'
import { useActiveStore } from '@/contexts/store'

interface InventoryItem {
  id: string
  name: string
  sku?: string | null
  category?: string | null
  brand?: string | null
  model?: string | null
  quantity: number
  min_quantity: number
  unit_cost?: number | null
  sale_price?: number | null
  store_id?: string | null
  stores?: { name: string } | null
  notes?: string | null
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const activeStore = useActiveStore()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const role = session?.user?.role ?? 'employee'
  const canDelete = role === 'admin' || role === 'director'

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(filterCategory && { category: filterCategory }),
      ...(activeStore && { storeId: activeStore.id }),
      ...(lowStockOnly && { lowStock: 'true' }),
    })
    const r = await fetch(`/api/inventory?${params}`)
    const d = await r.json()
    setItems(d.data ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [search, filterCategory, activeStore, lowStockOnly])

  useEffect(() => {
    const t = setTimeout(fetchItems, 300)
    return () => clearTimeout(t)
  }, [fetchItems])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article de l\'inventaire ?')) return
    setDeletingId(id)
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    await fetchItems()
    setDeletingId(null)
  }

  const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventaire</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} article{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setSelected(null); setShowModal(true) }} className="btn-primary">
          <Plus size={16} />Ajouter un article
        </button>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && !lowStockOnly && (
        <button
          onClick={() => setLowStockOnly(true)}
          className="w-full flex items-center gap-3 p-3.5 bg-orange-50 border border-orange-100 rounded-xl text-left hover:bg-orange-100 transition-colors"
        >
          <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
          <span className="text-sm text-orange-700 font-medium">
            {lowStockCount} article{lowStockCount !== 1 ? 's' : ''} en stock bas — Cliquer pour filtrer
          </span>
        </button>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input pl-9" placeholder="Nom, référence, marque..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">Toutes catégories</option>
          {['Écrans','Batteries','Connecteurs','Caméras','Haut-parleurs','Châssis','Accessoires','Autre'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => setLowStockOnly(v => !v)}
          className={`btn-secondary ${lowStockOnly ? 'border-orange-300 bg-orange-50 text-orange-700' : ''}`}
        >
          <AlertTriangle size={14} />Stock bas
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">
              {search || filterCategory || lowStockOnly ? 'Aucun article trouvé' : 'Inventaire vide'}
            </p>
            {!search && !filterCategory && !lowStockOnly && (
              <button onClick={() => { setSelected(null); setShowModal(true) }} className="text-sm text-blue-600 hover:underline">
                Ajouter le premier article
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
                    {['Article','Référence','Catégorie','Quantité','Prix achat','Prix vente','Boutique',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(item => {
                    const isLow = item.quantity <= item.min_quantity
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {(item.brand || item.model) && (
                            <p className="text-xs text-gray-400">{item.brand} {item.model}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.category ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                            {item.quantity}
                          </span>
                          {isLow && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-orange-500">
                              <AlertTriangle size={11} />bas
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.unit_cost != null ? `${item.unit_cost} €` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.sale_price != null ? `${item.sale_price} €` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{item.stores?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setSelected(item); setShowModal(true) }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {items.map(item => {
                const isLow = item.quantity <= item.min_quantity
                return (
                  <div key={item.id} className="px-4 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.category && <span className="text-xs text-gray-400">{item.category}</span>}
                        <span className={`text-xs font-semibold ${isLow ? 'text-orange-600' : 'text-gray-600'}`}>
                          {item.quantity} en stock{isLow && ' ⚠'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => { setSelected(item); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-blue-600">
                      <Pencil size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <InventoryModal
          item={selected}
          onClose={() => { setShowModal(false); setSelected(null) }}
          onSaved={() => { setShowModal(false); setSelected(null); fetchItems() }}
        />
      )}
    </div>
  )
}
