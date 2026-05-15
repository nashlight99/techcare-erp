'use client'
import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, Wrench, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import type { DashboardStats, Repair } from '@/types'

interface StatusStat { status: string; count: number }

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/repairs?limit=100').then(r => r.json()),
    ]).then(([s, r]) => {
      setStats(s)
      setRepairs(r.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const byStatus: StatusStat[] = Object.keys(STATUS_LABELS).map(status => ({
    status,
    count: repairs.filter(r => r.status === status).length,
  }))
  const total = repairs.length || 1

  const revenue = repairs
    .filter(r => r.status === 'completed' && r.final_cost)
    .reduce((sum, r) => sum + (r.final_cost ?? 0), 0)

  const avgCost = repairs.filter(r => r.final_cost).length
    ? revenue / repairs.filter(r => r.final_cost).length
    : 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytiques</h1>
        <p className="text-sm text-gray-400 mt-0.5">Performances et statistiques de votre activité</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total tickets',    value: loading ? '—' : repairs.length,             icon: Wrench,       color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Terminés',         value: loading ? '—' : byStatus.find(s => s.status === 'completed')?.count ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'En cours',         value: loading ? '—' : byStatus.find(s => s.status === 'in_progress')?.count ?? 0, icon: Clock,      color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Chiffre d\'affaires', value: loading ? '—' : `${revenue.toFixed(0)} €`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repairs by status */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Répartition par statut</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sur les {repairs.length} derniers tickets</p>
          </div>
          <div className="p-5 space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between mb-1.5">
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                      <div className="h-3 w-8 bg-gray-100 rounded" />
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full" />
                  </div>
                ))
              : byStatus.map(({ status, count }) => {
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Revenue stats */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Indicateurs financiers</h2>
            <p className="text-xs text-gray-400 mt-0.5">Basé sur les tickets avec coût final renseigné</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'CA total (terminés)',  value: `${revenue.toFixed(2)} €`,      icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Coût moyen / ticket',  value: `${avgCost.toFixed(2)} €`,       icon: BarChart2,  color: 'text-blue-600',  bg: 'bg-blue-50' },
              { label: 'Taux de complétion',   value: `${Math.round(((byStatus.find(s => s.status === 'completed')?.count ?? 0) / total) * 100)} %`, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Tickets annulés',      value: byStatus.find(s => s.status === 'cancelled')?.count ?? 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={15} className={color} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {loading ? <span className="w-12 h-4 bg-gray-100 rounded animate-pulse inline-block" /> : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
