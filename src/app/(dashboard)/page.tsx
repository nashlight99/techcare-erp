'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Wrench, Users, CheckCircle2, Clock, TrendingUp, BarChart2,
  XCircle, ArrowRight, Package, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'
import type { DashboardStats, Repair } from '@/types'
import type { InventoryItem } from './inventory/page'

const STATUS_HEX: Record<string, string> = {
  received:         '#94a3b8',
  in_progress:      '#3b82f6',
  waiting_parts:    '#f59e0b',
  waiting_customer: '#a78bfa',
  completed:        '#22c55e',
  cancelled:        '#f87171',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
        <p className="font-medium">{label}</p>
        <p className="text-gray-300 mt-0.5">{payload[0].value} ticket{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/interventions?limit=100').then(r => r.json()),
      fetch('/api/inventory?lowStock=true&limit=5').then(r => r.json()),
    ]).then(([s, r, inv]) => {
      setStats(s)
      setRepairs(r.data ?? [])
      setLowStockItems(inv.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  const chartData = Object.keys(STATUS_LABELS).map(status => ({
    name: STATUS_LABELS[status],
    count: repairs.filter(r => r.status === status).length,
    color: STATUS_HEX[status] ?? '#94a3b8',
    status,
  }))

  const totalRepairs = repairs.length || 1
  const revenue = repairs
    .filter(r => r.status === 'completed' && r.final_cost)
    .reduce((sum, r) => sum + (r.final_cost ?? 0), 0)
  const completedCount = repairs.filter(r => r.status === 'completed').length
  const completionRate = Math.round((completedCount / totalRepairs) * 100)
  const avgCost = repairs.filter(r => r.final_cost).length
    ? revenue / repairs.filter(r => r.final_cost).length
    : 0

  const recentTickets = repairs.slice(0, 6)

  const kpis = [
    { label: 'Total clients',        value: stats?.totalCustomers ?? 0,  icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/customers' },
    { label: 'Réparations actives',  value: stats?.activeRepairs ?? 0,   icon: Wrench,       color: 'text-orange-600', bg: 'bg-orange-50', href: '/interventions' },
    { label: "Terminées aujourd'hui",value: stats?.completedToday ?? 0,  icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50',  href: '/interventions' },
    { label: 'Attente pièces',       value: stats?.waitingParts ?? 0,    icon: Clock,        color: 'text-purple-600', bg: 'bg-purple-50', href: '/interventions' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Bonjour{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
          <TrendingUp size={13} />
          Système actif
        </div>
      </div>

      {/* Low stock alert */}
      {!loading && lowStockItems.length > 0 && (
        <Link
          href="/inventory"
          className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-700 font-medium flex-1">
            {lowStockItems.length} article{lowStockItems.length !== 1 ? 's' : ''} en stock bas —{' '}
            {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}
            {lowStockItems.length > 3 ? '…' : ''}
          </span>
          <ArrowRight size={14} className="text-amber-400 flex-shrink-0" />
        </Link>
      )}

      {/* KPI cards */}
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
              <Link key={label} href={href} className="card-hover p-5 group">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5 group-hover:text-gray-700 transition-colors">{label}</p>
              </Link>
            ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Status BarChart — wider */}
        <div className="card lg:col-span-3">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Répartition par statut</h2>
              <p className="text-xs text-gray-400 mt-0.5">{repairs.length} tickets chargés</p>
            </div>
            <BarChart2 size={16} className="text-gray-300" />
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Financial indicators — narrower */}
        <div className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Indicateurs</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tickets clôturés</p>
            </div>
            <TrendingUp size={16} className="text-gray-300" />
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Chiffre d'affaires", value: loading ? null : `${revenue.toFixed(2)} €`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Coût moyen / ticket', value: loading ? null : `${avgCost.toFixed(2)} €`, icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Taux de complétion', value: loading ? null : `${completionRate} %`, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Tickets annulés', value: loading ? null : repairs.filter(r => r.status === 'cancelled').length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={15} className={color} />
                </div>
                <p className="text-xs text-gray-500 flex-1">{label}</p>
                {value === null
                  ? <span className="w-16 h-4 bg-gray-100 rounded animate-pulse inline-block" />
                  : <p className="text-sm font-semibold text-gray-900">{value}</p>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tickets récents</h2>
          <Link href="/interventions" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
            Voir tout <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="py-12 text-center">
            <Wrench size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucun ticket pour le moment</p>
            <Link href="/interventions" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Créer le premier ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTickets.map((t) => (
              <Link
                key={t.id}
                href={`/interventions/${t.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-blue-600">{t.ticket_number}</span>
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
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/interventions', label: 'Nouveau ticket',  icon: Wrench,    color: 'text-blue-600',   bg: 'bg-blue-50' },
          { href: '/customers',     label: 'Clients',         icon: Users,     color: 'text-green-600',  bg: 'bg-green-50' },
          { href: '/inventory',     label: 'Inventaire',      icon: Package,   color: 'text-orange-600', bg: 'bg-orange-50' },
          { href: '/analytics',     label: 'Analytiques',     icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ href, label, icon: Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="card-hover p-4 flex flex-col items-center gap-2 text-center group"
          >
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon size={17} className={color} />
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
