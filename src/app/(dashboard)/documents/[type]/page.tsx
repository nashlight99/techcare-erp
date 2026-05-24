'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ClipboardCheck, FileText, Receipt, ExternalLink, FileX, Plus } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'
import { useActiveStore } from '@/contexts/store'
import { RepairModal } from '@/components/repairs/RepairModal'

type DocType = 'prise-en-charge' | 'devis' | 'factures'

const CONFIG: Record<DocType, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
  desc: string
  docParam: string
  filterStatus?: string
}> = {
  'prise-en-charge': {
    label: 'Prises en charge',
    icon: ClipboardCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    desc: 'Toutes les prises en charge client',
    docParam: 'prise_en_charge',
  },
  'devis': {
    label: 'Devis',
    icon: FileText,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    desc: 'Interventions avec un devis estimé',
    docParam: 'devis',
  },
  'factures': {
    label: 'Factures',
    icon: Receipt,
    color: 'text-green-600',
    bg: 'bg-green-50',
    desc: 'Interventions terminées — facturables',
    docParam: 'facture',
    filterStatus: 'completed',
  },
}

function docNumber(docParam: string, ticketNumber: string): string {
  const suffix = ticketNumber?.replace(/^[A-Z]+-?/i, '') ?? '?'
  if (docParam === 'devis') return `DEV-${suffix}`
  if (docParam === 'facture') return `FAC-${suffix}`
  return ticketNumber ?? '—'
}

export default function DocumentsPage() {
  const { type } = useParams<{ type: string }>()
  const router = useRouter()
  const activeStore = useActiveStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const cfg = CONFIG[type as DocType]

  const fetchTickets = useCallback(async () => {
    if (!cfg) return
    setLoading(true)
    const params = new URLSearchParams({
      limit: '100',
      ...(search && { search }),
      ...(cfg.filterStatus && { status: cfg.filterStatus }),
      ...(activeStore && { storeId: activeStore.id }),
    })
    const r = await fetch(`/api/repairs?${params}`)
    const d = await r.json()
    let data: any[] = d.data ?? []
    // For devis, only show tickets that have an estimated cost
    if (type === 'devis') {
      data = data.filter((t: any) => t.estimated_cost != null && t.estimated_cost > 0)
    }
    setTickets(data)
    setTotal(data.length)
    setLoading(false)
  }, [type, search, activeStore, cfg])

  useEffect(() => {
    const t = setTimeout(fetchTickets, 300)
    return () => clearTimeout(t)
  }, [fetchTickets])

  if (!cfg) {
    return <div className="p-8 text-center text-gray-400">Type de document invalide</div>
  }

  const Icon = cfg.icon

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={cfg.color} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{cfg.label}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{total} document{total !== 1 ? 's' : ''} — {cfg.desc}</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex-shrink-0">
          <Plus size={15} />
          Nouvelle intervention
        </button>
      </div>

      {/* Sub-nav between doc types */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(Object.entries(CONFIG) as [DocType, typeof CONFIG[DocType]][]).map(([t, c]) => {
          const TabIcon = c.icon
          const active = t === type
          return (
            <Link
              key={t}
              href={`/documents/${t}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TabIcon size={14} />
              {c.label}
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="input pl-9"
          placeholder="Numéro, client, appareil..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex items-center gap-4">
                <div className="w-20 h-4 bg-gray-100 rounded" />
                <div className="flex-1 h-4 bg-gray-100 rounded" />
                <div className="w-16 h-4 bg-gray-100 rounded" />
                <div className="w-24 h-8 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <FileX size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {search ? 'Aucun résultat pour cette recherche' : `Aucun document ${cfg.label.toLowerCase()} pour l'instant`}
            </p>
            {type === 'devis' && !search && (
              <p className="text-xs text-gray-400 mt-1">Les devis apparaissent dès qu'un coût estimé est renseigné sur une intervention</p>
            )}
            {type === 'factures' && !search && (
              <p className="text-xs text-gray-400 mt-1">Les factures apparaissent une fois l'intervention marquée comme terminée</p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">N° Document</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Client</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Appareil</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Statut</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {type === 'factures' ? 'Montant TTC' : type === 'devis' ? 'Devis TTC' : 'Date'}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t: any) => {
                    const costHT = parseFloat(
                      type === 'factures'
                        ? (t.final_cost ?? t.estimated_cost ?? 0)
                        : (t.estimated_cost ?? 0)
                    )
                    const ttc = (costHT * 1.2).toFixed(2)
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-mono text-xs font-bold text-gray-700">{docNumber(cfg.docParam, t.ticket_number)}</p>
                            <Link href={`/interventions/${t.id}`} className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                              {t.ticket_number} <ExternalLink size={9} />
                            </Link>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {t.customers?.first_name} {t.customers?.last_name}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{t.device_brand} {t.device_model}</td>
                        <td className="px-5 py-3.5">
                          <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {costHT > 0
                            ? <span className="font-semibold text-gray-900">{ttc} €</span>
                            : <span className="text-gray-400 text-xs">Non renseigné</span>
                          }
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/interventions/${t.id}/document/${cfg.docParam}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${cfg.bg} border-transparent ${cfg.color} hover:border-current`}
                          >
                            <Icon size={13} />
                            Voir / Imprimer
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-50">
              {tickets.map((t: any) => {
                const costHT = parseFloat(
                  type === 'factures'
                    ? (t.final_cost ?? t.estimated_cost ?? 0)
                    : (t.estimated_cost ?? 0)
                )
                const ttc = (costHT * 1.2).toFixed(2)
                return (
                  <div key={t.id} className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-mono text-xs font-bold text-gray-700">{docNumber(cfg.docParam, t.ticket_number)}</span>
                        <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {t.customers?.first_name} {t.customers?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{t.device_brand} {t.device_model}</p>
                      {costHT > 0 && <p className="text-xs font-semibold text-gray-700 mt-0.5">{ttc} € TTC</p>}
                    </div>
                    <Link
                      href={`/interventions/${t.id}/document/${cfg.docParam}`}
                      className={`flex-shrink-0 p-2.5 rounded-xl ${cfg.bg} ${cfg.color}`}
                    >
                      <Icon size={18} />
                    </Link>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <RepairModal
          ticket={null}
          onClose={() => setShowModal(false)}
          onSaved={(created) => {
            setShowModal(false)
            if (created?.id) {
              router.push(`/interventions/${created.id}/document/${cfg.docParam}`)
            } else {
              fetchTickets()
            }
          }}
        />
      )}
    </div>
  )
}
