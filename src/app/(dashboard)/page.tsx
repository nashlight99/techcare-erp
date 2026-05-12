'use client'
import { useEffect, useState } from 'react'
import { Wrench, Users, CheckCircle2, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/repairs?limit=5').then(r => r.json()),
    ]).then(([s, t]) => {
      setStats(s)
      setRecentTickets(t.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: 'Total clients', value: stats.totalCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Réparations actives', value: stats.activeRepairs, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: "Terminées aujourd'hui", value: stats.completedToday, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Attente pièces', value: stats.waitingParts, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : []

  const statusColors: Record<string, string> = {
    received: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    waiting_parts: 'bg-yellow-100 text-yellow-700',
    waiting_customer: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const statusLabels: Record<string, string> = {
    received: 'Reçu', in_progress: 'En cours', waiting_parts: 'Attente pièces',
    waiting_customer: 'Attente client', completed: 'Terminé', cancelled: 'Annulé',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Vue globale</h1>
        <p className="text-sm text-gray-400 mt-0.5">Bienvenue sur votre tableau de bord</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse"><div className="w-8 h-8 bg-gray-100 rounded-lg mb-3" /><div className="h-7 bg-gray-100 rounded w-16 mb-1" /><div className="h-4 bg-gray-100 rounded w-24" /></div>
        )) : kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}><Icon size={18} className={color} /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tickets récents</h2>
          <a href="/repairs" className="text-xs text-blue-600 hover:underline">Voir tout</a>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : recentTickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Aucun ticket pour le moment</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTickets.map((t: any) => (
              <a key={t.id} href={`/repairs/${t.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-600">{t.ticket_number}</span>
                    <span className={`badge ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 truncate">{t.customers?.first_name} {t.customers?.last_name} — {t.device_brand} {t.device_model}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
