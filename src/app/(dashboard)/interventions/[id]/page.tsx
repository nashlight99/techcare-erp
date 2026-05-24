'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, User, Smartphone, Wrench, Clock,
  MapPin, Phone, Mail, Euro, FileText, ClipboardCheck, Receipt,
} from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, STATUSES } from '@/lib/constants'
import { RepairModal } from '@/components/repairs/RepairModal'

interface StatusHistory {
  id: string
  old_status: string | null
  new_status: string
  changed_by: string
  created_at: string
}

const DOCS = [
  {
    type: 'prise_en_charge',
    label: 'Prise en charge',
    icon: ClipboardCheck,
    desc: 'Accord client + infos appareil',
    color: 'hover:bg-blue-50 hover:border-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    type: 'devis',
    label: 'Devis',
    icon: FileText,
    desc: 'Estimation du coût HT/TTC',
    color: 'hover:bg-orange-50 hover:border-orange-200',
    iconColor: 'text-orange-600',
  },
  {
    type: 'facture',
    label: 'Facture',
    icon: Receipt,
    desc: 'Facturation finale avec TVA',
    color: 'hover:bg-green-50 hover:border-green-200',
    iconColor: 'text-green-600',
  },
]

export default function InterventionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchTicket = async () => {
    setLoading(true)
    const r = await fetch(`/api/repairs/${id}`)
    if (r.ok) setTicket(await r.json())
    setLoading(false)
  }

  useEffect(() => { fetchTicket() }, [id])

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true)
    await fetch(`/api/repairs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchTicket()
    setUpdatingStatus(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="card p-6 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-5 bg-gray-100 rounded w-full" />)}
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Intervention introuvable</p>
        <button onClick={() => router.push('/interventions')} className="btn-secondary">
          <ArrowLeft size={15} />Retour aux interventions
        </button>
      </div>
    )
  }

  const history: StatusHistory[] = ticket.repair_status_history ?? []

  return (
    <div className="max-w-4xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/interventions')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-blue-600">{ticket.ticket_number}</h1>
              <span className={`badge ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {ticket.stores && <span> · {ticket.stores.name}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={ticket.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={updatingStatus}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50"
          >
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="btn-secondary">
            <Pencil size={14} />Modifier
          </button>
        </div>
      </div>

      {/* Document generation — central action zone */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Générer un document</h2>
          <span className="text-xs text-gray-400">— pré-rempli depuis cette intervention</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DOCS.map(({ type, label, icon: Icon, desc, color, iconColor }) => (
            <Link
              key={type}
              href={`/interventions/${id}/document/${type}`}
              className={`flex items-start gap-3 p-4 border border-gray-200 rounded-xl transition-all ${color} group`}
            >
              <div className="w-9 h-9 bg-gray-100 group-hover:bg-white rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                <Icon size={17} className={iconColor} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Client + Device */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Client</h2>
          </div>
          {ticket.customers ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                  {((ticket.customers.first_name?.[0] ?? '') + (ticket.customers.last_name?.[0] ?? '')).toUpperCase() || '?'}
                </div>
                <p className="font-medium text-gray-900">
                  {ticket.customers.first_name} {ticket.customers.last_name}
                </p>
              </div>
              {ticket.customers.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={13} className="text-gray-400" />
                  {ticket.customers.phone}
                  {ticket.customers.whatsapp_available && (
                    <span className="text-xs text-green-600 font-medium">WA</span>
                  )}
                </div>
              )}
              {ticket.customers.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={13} className="text-gray-400" />
                  {ticket.customers.email}
                </div>
              )}
              {ticket.customers.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={13} className="text-gray-400" />
                  {ticket.customers.address}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Client introuvable</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Appareil</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Marque / Modèle" value={`${ticket.device_brand ?? '—'} ${ticket.device_model ?? ''}`} />
            {ticket.serial_number && <Row label="N° de série" value={ticket.serial_number} mono />}
            {ticket.imei && <Row label="IMEI" value={ticket.imei} mono />}
            {ticket.users && <Row label="Technicien" value={ticket.users.full_name} />}
          </div>
        </div>
      </div>

      {/* Problem */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wrench size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Description du problème</h2>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {ticket.issue_description || <span className="text-gray-400">Aucune description</span>}
        </p>
      </div>

      {/* Billing + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Euro size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Facturation</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Devis" value={ticket.estimated_cost != null ? `${ticket.estimated_cost} € HT` : '—'} />
            <Row label="Prix final" value={ticket.final_cost != null ? `${ticket.final_cost} € HT` : '—'} />
            {ticket.estimated_cost != null && (
              <Row label="TTC estimé (20%)" value={`${(ticket.estimated_cost * 1.2).toFixed(2)} €`} />
            )}
            {ticket.final_cost != null && (
              <Row label="TTC final (20%)" value={`${(ticket.final_cost * 1.2).toFixed(2)} €`} />
            )}
            {ticket.completed_at && (
              <Row label="Terminé le" value={new Date(ticket.completed_at).toLocaleDateString('fr-FR')} />
            )}
          </div>
        </div>

        {ticket.internal_notes && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Notes internes</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ticket.internal_notes}</p>
          </div>
        )}
      </div>

      {/* Status history */}
      {history.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Historique des statuts</h2>
          </div>
          <div className="relative pl-5">
            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gray-100" />
            <div className="space-y-4">
              {history
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(h => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-blue-200 flex-shrink-0 mt-0.5 -ml-6" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {h.old_status && (
                          <>
                            <span className={`badge ${STATUS_COLORS[h.old_status]}`}>{STATUS_LABELS[h.old_status]}</span>
                            <span className="text-gray-300 text-xs">→</span>
                          </>
                        )}
                        <span className={`badge ${STATUS_COLORS[h.new_status]}`}>{STATUS_LABELS[h.new_status]}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(h.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <RepairModal
          ticket={ticket}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchTicket() }}
        />
      )}

    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-gray-800 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
