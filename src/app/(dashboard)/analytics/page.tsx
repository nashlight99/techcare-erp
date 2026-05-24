'use client'
import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, Wrench, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import type { DashboardStats, Repair } from '@/types'

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

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/interventions?limit=200').then(r => r.json()),
    ]).then(([s, r]) => {
      setStats(s)
      setRepairs(r.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const byStatus = Object.keys(STATUS_LABELS).map(status => ({
    name: STATUS_LABELS[status],
    count: repairs.filter(r => r.status === status).length,
    color: STATUS_HEX[status] ?? '#94a3b8',
    status,
  }))

  const total = repairs.length || 1
  const revenue = repairs
    .filter(r => r.status === 'completed' && r.final_cost)
    .reduce((sum, r) => sum + (r.final_cost ?? 0), 0)
  const completedCount = repairs.filter(r => r.status === 'completed').length
  const completionRate = Math.round((completedCount / total) * 100)
  const avgCost = repairs.filter(r => r.final_cost).length
    ? revenue / repairs.filter(r => r.final_cost).length
    : 0

  // Tickets by week (last 8 weeks)
  const weeklyData = (() => {
    const weeks: Record<string, number> = {}
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      const key = `S${i === 0 ? 'em' : i === 1 ? '-1' : `-${i}`}`
      weeks[key] = 0
    }
    repairs.forEach(r => {
      const d = new Date(r.created_at)
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      const weekIndex = Math.floor(diffDays / 7)
      if (weekIndex >= 0 && weekIndex <= 7) {
        const key = weekIndex === 0 ? 'Sem' : weekIndex === 1 ? 'S-1' : `S-${weekIndex}`
        weeks[key] = (weeks[key] ?? 0) + 1
      }
    })
    return Object.entries(weeks).map(([name, count]) => ({ name, count })).reverse()
  })()

  const summaryCards = [
    { label: 'Total tickets',         value: loading ? '—' : repairs.length,       icon: Wrench,      color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Terminés',              value: loading ? '—' : completedCount,        icon: CheckCircle2,color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'En cours',              value: loading ? '—' : repairs.filter(r => r.status === 'in_progress').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: "Chiffre d'affaires",    value: loading ? '—' : `${revenue.toFixed(0)} €`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytiques</h1>
          <p className="text-sm text-gray-400 mt-0.5">Performances et statistiques de votre activité</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
          <Calendar size={13} />
          {repairs.length} tickets analysés
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            {loading
              ? <div className="h-7 bg-gray-100 rounded w-14 mb-1 animate-pulse" />
              : <p className="text-2xl font-bold text-gray-900">{value}</p>
            }
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly volume */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Volume hebdomadaire</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tickets créés par semaine (8 dernières semaines)</p>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barSize={24} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status distribution */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Répartition par statut</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sur les {repairs.length} derniers tickets</p>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byStatus} barSize={28} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {byStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Financial indicators */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Indicateurs financiers</h2>
          <p className="text-xs text-gray-400 mt-0.5">Basé sur les tickets avec coût final renseigné</p>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: 'CA total (terminés)',  value: `${revenue.toFixed(2)} €`,  icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Coût moyen / ticket',  value: `${avgCost.toFixed(2)} €`,  icon: BarChart2,  color: 'text-blue-600',  bg: 'bg-blue-50' },
            { label: 'Taux de complétion',   value: `${completionRate} %`,       icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Tickets annulés',      value: repairs.filter(r => r.status === 'cancelled').length, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              {loading
                ? <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
                : <p className="text-xl font-bold text-gray-900">{value}</p>
              }
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
