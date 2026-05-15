'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Wrench, Users, CheckCircle2, Clock, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'
import type { DashboardStats, Repair } from '@/types'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTickets, setRecentTickets] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/repairs?limit=6').then(r => r.json()),
    ]).then(([s, t]) => {
      setStats(s)
      setRecentTickets(t.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: 'Total clients',         value: stats.totalCustomers, icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/customers' },
    { label: 'Réparations actives',   value: stats.activeRepairs,  icon: Wrench,        color: 'text-orange-600', bg: 'bg-orange-50', href: '/repairs' },
    { label: "Terminées aujourd'hui", value: stats.completedToday, icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  href: '/repairs?status=completed' },
    { label: 'Attente pièces',        value: stats.waitingParts,   icon: Clock,         color: 'text-purple-600', bg: 'bg-purple-50', href: '/repairs?status=waiting_parts' },
  ] : []

  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Bonjour{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Voici un aperçu de votre activité aujourd'hui</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
          <TrendingUp size={13} />
          Système actif
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="w-9 h-9 bg-gray-100 rounded-lg mb-3" />
                <div className="h-7 bg-gray-100 rounded w-14 mb-1" />
                <div className="h-3.5 bg-gray-100 rounded w-28" />
              </div>
            ))
          : kpis.map(({ label, value, icon: Icon, color, bg, href }) => (
              <Link key={label} href={href} className="card p-5 hover:shadow-md transition-shadow group">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
                <p className="text-sm text-gray-500 mt-0.5 group-hover:text-gray-700 transition-colors">{label}</p>
              </Link>
            ))
        }
      </div>

      {/* Recent tickets */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tickets récents</h2>
          <Link href="/repairs" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Voir tout <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="py-12 text-center">
            <Wrench size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucun ticket pour le moment</p>
            <Link href="/repairs" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Créer le premier ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTickets.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-medium text-blue-600">{t.ticket_number}</span>
                    <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 truncate">
                    {t.customers?.first_name} {t.customers?.last_name}
                    <span className="text-gray-400"> — {t.device_brand} {t.device_model}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(t.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
