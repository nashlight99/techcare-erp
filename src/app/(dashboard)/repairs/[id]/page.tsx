'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, User, Smartphone, Wrench, Clock,
  MapPin, Phone, Mail, Euro, FileText, CheckCircle2,
} from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'
import { RepairModal } from '@/components/repairs/RepairModal'

interface StatusHistory {
  id: string
  old_status: string | null
  new_status: string
  changed_by: string
  created_at: string
}

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchTicket = async () => {
    setLoading(true)
    const r = await fetch(`/api/repairs/${id}`)
    if (r.ok) setTicket(await r.json())
    setLoading(false)
  }

  useEffect(() => { fetchTicket() }, [id])

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
        <p className="text-gray-400 mb-4">Ticket introuvable</p>
        <button onClick={() => router.push('/repairs')} className="btn-secondary">
          <ArrowLeft size={15} />Retour aux réparations
        </button>
      </div>
    )
  }

  const history: StatusHistory[] = ticket.repair_status_history ?? []

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/repairs')} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
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
        <button onClick={() => setShowModal(true)} className="btn-secondary flex-shrink-0">
          <Pencil size={14} />Modifier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Client */}
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
                <p className="font-medium text-gray-900">{ticket.customers.first_name} {ticket.customers.last_name}</p>
              </div>
              {ticket.customers.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={13} className="text-gray-400" />
                  {ticket.customers.phone}
                  {ticket.customers.whatsapp_available && <span className="text-xs text-green-600 font-medium">WA</span>}
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

        {/* Appareil */}
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

      {/* Problem description */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wrench size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Description du problème</h2>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {ticket.issue_description || <span className="text-gray-400">Aucune description</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Costs */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Euro size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Facturation</h2>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Devis" value={ticket.estimated_cost != null ? `${ticket.estimated_cost} €` : '—'} />
            <Row label="Prix final" value={ticket.final_cost != null ? `${ticket.final_cost} €` : '—'} />
            {ticket.completed_at && (
              <Row label="Terminé le" value={new Date(ticket.completed_at).toLocaleDateString('fr-FR')} />
            )}
          </div>
        </div>

        {/* Internal notes */}
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
                        {new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              }
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
