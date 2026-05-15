'use client'
import { Package, Plus, AlertTriangle, ArrowUpDown, Tag } from 'lucide-react'

const COMING_FEATURES = [
  { icon: Package,       title: 'Catalogue pièces',     desc: 'Smartphones, tablettes, ordinateurs' },
  { icon: AlertTriangle, title: 'Alertes de rupture',   desc: 'Notifications stock bas automatiques' },
  { icon: ArrowUpDown,   title: 'Entrées / Sorties',    desc: 'Historique complet des mouvements' },
  { icon: Tag,           title: 'Gestion fournisseurs', desc: 'Commandes et devis fournisseurs' },
]

export default function InventoryPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventaire</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestion des pièces et accessoires</p>
        </div>
        <button disabled className="btn-primary opacity-40 cursor-not-allowed">
          <Plus size={16} />Ajouter un article
        </button>
      </div>

      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Package size={28} className="text-blue-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">Module en développement</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          La gestion d'inventaire sera disponible prochainement. Vous pourrez suivre les stocks de pièces
          détachées et accessoires en temps réel.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
          {COMING_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon size={15} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          En cours de développement
        </div>
      </div>
    </div>
  )
}
