'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Loader2, Plus, Trash2, Save } from 'lucide-react'

type DocType = 'prise_en_charge' | 'devis' | 'facture'

const DOC_LABELS: Record<string, string> = {
  prise_en_charge: 'Prise en charge',
  devis: 'Devis',
  facture: 'Facture',
}

interface LineItem {
  id: string
  designation: string
  description: string
  qty: number
  unitPrice: number
  discount: number // percent
}

function newItem(designation = '', unitPrice = 0): LineItem {
  return {
    id: Math.random().toString(36).slice(2),
    designation,
    description: '',
    qty: 1,
    unitPrice,
    discount: 0,
  }
}

function itemTotal(item: LineItem): number {
  const base = item.qty * item.unitPrice
  return +(base * (1 - item.discount / 100)).toFixed(2)
}

function docNumber(type: string, ticketNumber: string): string {
  const suffix = ticketNumber?.replace(/^[A-Z]+-?/i, '') ?? '00000'
  if (type === 'devis') return `DEV-${suffix}`
  if (type === 'facture') return `FAC-${suffix}`
  return ticketNumber ?? '—'
}

function fmtDate(iso?: string | null) {
  if (!iso) return new Date().toLocaleDateString('fr-FR')
  return new Date(iso).toLocaleDateString('fr-FR')
}

const TVA_RATE = 0.2

export default function DocumentPage() {
  const { id, type } = useParams<{ id: string; type: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<LineItem[]>([])
  const [saved, setSaved] = useState(false)

  const storageKey = `devis-items-${id}-${type}`

  useEffect(() => {
    fetch(`/api/repairs/${id}`)
      .then(r => r.json())
      .then(data => {
        setTicket(data)
        // Load saved items from localStorage, or create default
        const saved = localStorage.getItem(`devis-items-${id}-${type}`)
        if (saved) {
          try { setItems(JSON.parse(saved)) } catch {}
        } else if (type === 'devis' || type === 'facture') {
          // Pre-fill with repair data
          const device = `${data.device_brand ?? ''} ${data.device_model ?? ''}`.trim()
          const issue = data.issue_description ?? data.problem_description ?? ''
          const cost = parseFloat(
            type === 'facture'
              ? (data.final_cost ?? data.estimated_cost ?? 0)
              : (data.estimated_cost ?? 0)
          )
          setItems([
            newItem(
              `${type === 'facture' ? 'Réparation réalisée' : 'Diagnostic & Réparation'} — ${device}`,
              cost
            ),
          ])
        }
      })
      .finally(() => setLoading(false))
  }, [id, type])

  const saveItems = useCallback((newItems: LineItem[]) => {
    setItems(newItems)
    localStorage.setItem(storageKey, JSON.stringify(newItems))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [storageKey])

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'qty' || field === 'unitPrice' || field === 'discount'
        ? parseFloat(value) || 0
        : value
      } : item
    )
    saveItems(updated)
  }

  const addItem = () => saveItems([...items, newItem()])
  const removeItem = (idx: number) => saveItems(items.filter((_, i) => i !== idx))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    )
  }

  if (!ticket || !DOC_LABELS[type]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Document introuvable</p>
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft size={15} />Retour
          </button>
        </div>
      </div>
    )
  }

  const c = ticket.customers ?? {}
  const clientName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—'
  const storeName = ticket.stores?.name ?? 'TechCare'
  const num = docNumber(type, ticket.ticket_number)
  const date = fmtDate(type === 'facture' ? ticket.completed_at : undefined)
  const device = `${ticket.device_brand ?? ''} ${ticket.device_model ?? ''}`.trim() || '—'
  const issue = ticket.issue_description ?? ticket.problem_description ?? '—'
  const validity = new Date(Date.now() + 30 * 86400000).toLocaleDateString('fr-FR')

  // Totals
  const totalHT = +items.reduce((sum, item) => sum + itemTotal(item), 0).toFixed(2)
  const tva = +(totalHT * TVA_RATE).toFixed(2)
  const ttc = +(totalHT + tva).toFixed(2)

  // For PEC: use estimated cost
  const costHT = parseFloat(ticket.estimated_cost ?? 0)
  const pecTva = +(costHT * TVA_RATE).toFixed(2)
  const pecTtc = +(costHT + pecTva).toFixed(2)

  return (
    <>
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à l&apos;intervention
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{DOC_LABELS[type]} — {num}</span>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Save size={11} /> Sauvegardé
            </span>
          )}
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer size={15} />
          Imprimer / PDF
        </button>
      </div>

      {/* Line items editor — only for devis/facture, hidden when printing */}
      {(type === 'devis' || type === 'facture') && (
        <div className="print:hidden fixed top-14 left-0 right-0 z-40 bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Lignes du document</p>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus size={13} /> Ajouter une ligne
              </button>
            </div>
            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <input
                      className="w-full text-xs font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400"
                      placeholder="Désignation…"
                      value={item.designation}
                      onChange={e => updateItem(idx, 'designation', e.target.value)}
                    />
                    <input
                      className="w-full text-[10px] text-gray-500 bg-transparent border-none outline-none placeholder-gray-300 mt-0.5"
                      placeholder="Description (optionnel)"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-gray-400 mb-0.5">Qté</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        className="w-12 text-xs text-center border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-blue-400"
                        value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-gray-400 mb-0.5">P.U. HT</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-20 text-xs text-center border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-blue-400"
                        value={item.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-gray-400 mb-0.5">Remise %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-14 text-xs text-center border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-blue-400"
                        value={item.discount}
                        onChange={e => updateItem(idx, 'discount', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col items-center min-w-[56px]">
                      <span className="text-[9px] text-gray-400 mb-0.5">Total HT</span>
                      <span className="text-xs font-semibold text-gray-900 px-1.5 py-1">{itemTotal(item).toFixed(2)} €</span>
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document — full page, print-ready */}
      <div
        className={`print:mt-0 bg-gray-100 print:bg-white py-8 print:py-0 px-4 print:px-0 ${
          type === 'devis' || type === 'facture'
            ? 'mt-[' + (16 + 44 + items.length * 60 + 60) + 'px]'
            : 'mt-16'
        }`}
        style={{ marginTop: type === 'devis' || type === 'facture' ? `${56 + 44 + items.length * 64 + 20}px` : '64px' }}
      >
        <div
          id="document"
          className="bg-white print:shadow-none shadow-lg rounded-xl print:rounded-none max-w-3xl mx-auto p-12 print:p-10 text-[13px] text-gray-900"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-blue-600">
            <div>
              <p className="text-2xl font-bold text-blue-700 tracking-tight">{storeName}</p>
              <p className="text-xs text-gray-500 mt-1">Réparation &amp; Vente mobile</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold uppercase tracking-widest text-gray-900">{DOC_LABELS[type]}</p>
              <p className="text-sm text-gray-500 mt-1">N° {num}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {type === 'devis' ? `Émis le ${fmtDate()}` : `Le ${date}`}
              </p>
              {type === 'devis' && (
                <p className="text-xs text-red-500 mt-0.5">Valable jusqu'au {validity}</p>
              )}
              {type === 'facture' && ticket.completed_at && (
                <p className="text-xs text-gray-400 mt-0.5">Réglé le {fmtDate(ticket.completed_at)}</p>
              )}
            </div>
          </div>

          {/* Client + Device */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 pb-1 border-b border-gray-200">
                {type === 'facture' ? 'Facturé à' : 'Client'}
              </p>
              <p className="font-bold text-gray-900">{clientName}</p>
              {c.phone && <p className="text-gray-600 mt-1">{c.phone}{c.whatsapp_available ? ' (WhatsApp)' : ''}</p>}
              {c.email && <p className="text-gray-600">{c.email}</p>}
              {c.address && <p className="text-gray-600">{c.address}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 pb-1 border-b border-gray-200">
                {type === 'facture' ? 'Référence intervention' : 'Appareil'}
              </p>
              {type === 'facture' && (
                <p className="text-gray-600 mb-1">Ticket : <span className="font-bold font-mono text-blue-600">{ticket.ticket_number}</span></p>
              )}
              <p className="font-bold text-gray-900">{device}</p>
              {ticket.serial_number && <p className="text-gray-600 mt-1">N° série : {ticket.serial_number}</p>}
              {ticket.imei && <p className="text-gray-600">IMEI : {ticket.imei}</p>}
              {ticket.stores && <p className="text-gray-600">Boutique : {storeName}</p>}
            </div>
          </div>

          {/* Prise en charge content */}
          {type === 'prise_en_charge' && (
            <>
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 pb-1 border-b border-gray-200">
                  Problème décrit par le client
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {issue}
                </div>
              </div>
              {costHT > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 pb-1 border-b border-gray-200">
                    Estimation tarifaire
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {pecTtc.toFixed(2)} € TTC
                    <span className="text-sm font-normal text-gray-400 ml-2">({costHT.toFixed(2)} € HT + TVA 20%)</span>
                  </p>
                </div>
              )}
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 pb-1 border-b border-gray-200">
                  Accord du client
                </p>
                <div className="space-y-3">
                  {[
                    "J'accepte le devis ci-dessus et autorise la réparation de mon appareil",
                    "Je reprends mon appareil en l'état sans réparation",
                    "Je suis informé(e) que les données de l'appareil peuvent être effacées lors de la réparation",
                    "Je suis informé(e) que les délais sont indicatifs et peuvent varier selon les disponibilités des pièces",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Devis / Facture line items table */}
          {(type === 'devis' || type === 'facture') && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 pb-1 border-b border-gray-200">
                Détail des prestations
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="text-left px-4 py-2.5 font-semibold rounded-tl-lg" style={{width:'45%'}}>Désignation</th>
                    <th className="text-right px-3 py-2.5 font-semibold" style={{width:'10%'}}>Qté</th>
                    <th className="text-right px-3 py-2.5 font-semibold" style={{width:'15%'}}>P.U. HT</th>
                    <th className="text-right px-3 py-2.5 font-semibold" style={{width:'12%'}}>Remise</th>
                    <th className="text-right px-4 py-2.5 font-semibold rounded-tr-lg" style={{width:'18%'}}>Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{item.designation || '—'}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 border-b border-gray-100">{item.qty}</td>
                      <td className="px-3 py-3 text-right text-gray-700 border-b border-gray-100">{item.unitPrice.toFixed(2)} €</td>
                      <td className="px-3 py-3 text-right border-b border-gray-100">
                        {item.discount > 0
                          ? <span className="text-orange-600 font-medium">-{item.discount}%</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 border-b border-gray-100">{itemTotal(item).toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals block */}
              <div className="flex justify-end mt-4">
                <div className="w-72 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="flex justify-between px-4 py-2.5 bg-gray-50 text-sm">
                    <span className="text-gray-500">Sous-total HT</span>
                    <span className="font-medium text-gray-900">{totalHT.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 bg-gray-50 text-sm border-t border-gray-200">
                    <span className="text-gray-500">TVA (20%)</span>
                    <span className="font-medium text-gray-900">{tva.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-blue-600 text-white">
                    <span className="font-bold text-base">TOTAL TTC</span>
                    <span className="font-bold text-xl">{ttc.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditions */}
          {type === 'devis' && (
            <div className="mb-8 border-l-4 border-blue-300 bg-blue-50 rounded-r-lg px-4 py-3 text-xs text-gray-600 leading-relaxed">
              Ce devis est valable 30 jours à compter de sa date d&apos;émission. Les pièces détachées restent la propriété de {storeName} jusqu&apos;au règlement complet. Tout appareil non retiré dans les 30 jours suivant la réparation pourra faire l&apos;objet de frais de garde.
            </div>
          )}
          {type === 'facture' && (
            <div className="mb-8 border-l-4 border-green-300 bg-green-50 rounded-r-lg px-4 py-3 text-xs text-gray-600 leading-relaxed">
              Facture acquittée — Appareil remis au client. {storeName} garantit les pièces posées pendant 3 mois à compter de la date de facturation, hors casse et dégâts des eaux.
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-8 pt-6 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-400 mb-8">
                {type === 'prise_en_charge' ? 'Signature du client :' : type === 'devis' ? 'Bon pour accord — Signature client :' : 'Signature client (bon pour reçu) :'}
              </p>
              <div className="border-t border-gray-300 pt-1">
                <p className="text-xs text-gray-400">Date : _______________</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-8">Cachet &amp; signature {storeName} :</p>
              <div className="border-t border-gray-300 pt-1">
                <p className="text-xs text-gray-400">Date : _______________</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            {storeName} — Document généré via TechCare ERP · {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </>
  )
}
