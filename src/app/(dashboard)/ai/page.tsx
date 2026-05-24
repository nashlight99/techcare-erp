'use client'
import { useEffect, useState } from 'react'
import {
  Sparkles, AlertTriangle, CheckCircle2, Clock, Package,
  TrendingUp, Wrench, Users, Lightbulb, ArrowRight, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import type { Repair } from '@/types'
import type { InventoryItem } from '../inventory/page'

type InsightLevel = 'critical' | 'warning' | 'info' | 'success' | 'tip'

interface Insight {
  id: string
  level: InsightLevel
  icon: React.ElementType
  title: string
  body: string
  action?: { label: string; href: string }
}

const LEVEL_STYLES: Record<InsightLevel, { bg: string; border: string; icon: string; badge: string; badgeBg: string }> = {
  critical: { bg: 'bg-red-50',    border: 'border-red-100',    icon: 'text-red-500',    badge: 'Critique',      badgeBg: 'bg-red-100 text-red-700' },
  warning:  { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'text-orange-500', badge: 'Attention',     badgeBg: 'bg-orange-100 text-orange-700' },
  info:     { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'text-blue-500',   badge: 'Info',          badgeBg: 'bg-blue-100 text-blue-700' },
  success:  { bg: 'bg-green-50',  border: 'border-green-100',  icon: 'text-green-500',  badge: 'Positif',       badgeBg: 'bg-green-100 text-green-700' },
  tip:      { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'text-purple-500', badge: 'Recommandation',badgeBg: 'bg-purple-100 text-purple-700' },
}

function generateInsights(
  repairs: Repair[],
  lowStock: InventoryItem[],
  completedToday: number,
  totalCustomers: number,
): Insight[] {
  const insights: Insight[] = []

  // --- Stock critique ---
  if (lowStock.length > 0) {
    const names = lowStock.slice(0, 3).map(i => i.name).join(', ')
    insights.push({
      id: 'stock-critical',
      level: lowStock.length >= 3 ? 'critical' : 'warning',
      icon: Package,
      title: `${lowStock.length} article${lowStock.length > 1 ? 's' : ''} en stock bas`,
      body: `${names}${lowStock.length > 3 ? ` et ${lowStock.length - 3} autre(s)` : ''} sont sous le seuil minimum. Un réapprovisionnement est conseillé pour éviter des blocages de tickets.`,
      action: { label: 'Voir l\'inventaire', href: '/inventory' },
    })
  }

  // --- Tickets bloqués (waiting > 3 jours) ---
  const now = Date.now()
  const blocked = repairs.filter(r => {
    if (r.status !== 'waiting_parts' && r.status !== 'received') return false
    const age = (now - new Date(r.created_at).getTime()) / 86400000
    return age > 3
  })
  if (blocked.length > 0) {
    const oldest = blocked.reduce((a, b) =>
      new Date(a.created_at) < new Date(b.created_at) ? a : b
    )
    const days = Math.floor((now - new Date(oldest.created_at).getTime()) / 86400000)
    insights.push({
      id: 'blocked-tickets',
      level: blocked.length >= 5 ? 'critical' : 'warning',
      icon: Clock,
      title: `${blocked.length} ticket${blocked.length > 1 ? 's' : ''} bloqué${blocked.length > 1 ? 's' : ''} depuis plus de 3 jours`,
      body: `Le ticket le plus ancien (${oldest.ticket_number}) attend depuis ${days} jours. Ces blocages peuvent impacter la satisfaction client.`,
      action: { label: 'Voir les réparations', href: '/interventions' },
    })
  }

  // --- Taux de complétion ---
  const completed = repairs.filter(r => r.status === 'completed').length
  const total = repairs.length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  if (total > 0 && rate < 25) {
    insights.push({
      id: 'low-completion',
      level: 'warning',
      icon: TrendingUp,
      title: `Taux de complétion faible : ${rate}%`,
      body: `Seulement ${completed} ticket${completed > 1 ? 's' : ''} sur ${total} sont terminés. Identifiez les goulots d'étranglement dans votre processus de réparation.`,
      action: { label: 'Analyser', href: '/analytics' },
    })
  }

  // --- Appareil le plus réparé ---
  if (repairs.length > 0) {
    const brandCount: Record<string, number> = {}
    repairs.forEach(r => {
      const b = r.device_brand?.trim()
      if (b) brandCount[b] = (brandCount[b] ?? 0) + 1
    })
    const topBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0]
    if (topBrand) {
      const pct = Math.round((topBrand[1] / repairs.length) * 100)
      insights.push({
        id: 'top-brand',
        level: 'info',
        icon: Wrench,
        title: `${topBrand[0]} est la marque la plus réparée`,
        body: `${topBrand[1]} ticket${topBrand[1] > 1 ? 's' : ''} sur ${repairs.length} (${pct}%) concernent des appareils ${topBrand[0]}. Assurez-vous d'avoir les pièces correspondantes en stock.`,
        action: { label: 'Vérifier le stock', href: '/inventory' },
      })
    }
  }

  // --- Revenu potentiel bloqué ---
  const inProgressRevenue = repairs
    .filter(r => ['in_progress', 'waiting_parts', 'received'].includes(r.status) && r.estimated_cost)
    .reduce((sum, r) => sum + (r.estimated_cost ?? 0), 0)
  if (inProgressRevenue > 0) {
    insights.push({
      id: 'pending-revenue',
      level: 'tip',
      icon: TrendingUp,
      title: `${inProgressRevenue.toFixed(0)} € de CA en cours`,
      body: `Ce montant correspond aux tickets actifs avec un coût estimé. Clôturer ces tickets augmentera votre chiffre d'affaires enregistré.`,
      action: { label: 'Voir les réparations', href: '/interventions' },
    })
  }

  // --- Bonne journée ---
  if (completedToday > 0) {
    insights.push({
      id: 'good-day',
      level: 'success',
      icon: CheckCircle2,
      title: `${completedToday} ticket${completedToday > 1 ? 's' : ''} terminé${completedToday > 1 ? 's' : ''} aujourd'hui`,
      body: `Bonne progression ! Continuez sur cette lancée pour améliorer votre taux de complétion global.`,
    })
  }

  // --- Base clients ---
  if (totalCustomers > 0) {
    const repairRate = total > 0 ? (total / totalCustomers * 100).toFixed(0) : '0'
    insights.push({
      id: 'customer-base',
      level: 'info',
      icon: Users,
      title: `${totalCustomers} clients dans votre base`,
      body: `Ratio moyen de ${repairRate}% de tickets par client. Envisagez des actions de fidélisation pour vos clients sans ticket récent.`,
      action: { label: 'Voir les clients', href: '/customers' },
    })
  }

  // --- Recommandation délai moyen ---
  const completedWithDates = repairs.filter(r => r.status === 'completed' && r.completed_at)
  if (completedWithDates.length > 0) {
    const avgDays = completedWithDates.reduce((sum, r) => {
      const d = (new Date(r.completed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000
      return sum + d
    }, 0) / completedWithDates.length
    insights.push({
      id: 'avg-duration',
      level: avgDays > 7 ? 'warning' : 'success',
      icon: Clock,
      title: `Délai moyen de réparation : ${avgDays.toFixed(1)} jours`,
      body: avgDays > 7
        ? `Ce délai est élevé. Analysez les étapes qui prennent le plus de temps et envisagez d'optimiser la gestion des pièces détachées.`
        : `Excellent délai de réparation. Maintenez ce rythme pour fidéliser vos clients.`,
    })
  }

  // --- Stock sain ---
  if (lowStock.length === 0 && total > 0) {
    insights.push({
      id: 'stock-ok',
      level: 'success',
      icon: Package,
      title: 'Stock en bonne santé',
      body: 'Aucun article n\'est sous le seuil d\'alerte. Votre gestion des stocks est optimale.',
    })
  }

  const order: InsightLevel[] = ['critical', 'warning', 'tip', 'info', 'success']
  return insights.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
}

function buildSummary(
  repairs: Repair[],
  completedToday: number,
  totalCustomers: number,
  lowStock: InventoryItem[],
): string {
  const active = repairs.filter(r => ['received', 'in_progress', 'waiting_parts', 'waiting_customer'].includes(r.status)).length
  const revenue = repairs
    .filter(r => r.status === 'completed' && r.final_cost)
    .reduce((sum, r) => sum + (r.final_cost ?? 0), 0)

  const parts: string[] = []

  if (completedToday > 0) parts.push(`${completedToday} réparation${completedToday > 1 ? 's terminées' : ' terminée'} aujourd'hui`)
  else parts.push('Aucune réparation clôturée aujourd\'hui')

  if (active > 0) parts.push(`${active} ticket${active > 1 ? 's' : ''} en cours`)

  if (revenue > 0) parts.push(`${revenue.toFixed(0)} € de CA généré`)

  if (lowStock.length > 0) parts.push(`${lowStock.length} article${lowStock.length > 1 ? 's' : ''} à réapprovisionner`)
  else if (repairs.length > 0) parts.push('stock en ordre')

  parts.push(`${totalCustomers} client${totalCustomers > 1 ? 's' : ''} dans la base`)

  return parts.join(' · ')
}

export default function AIPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [lowStock, setLowStock] = useState<InventoryItem[]>([])
  const [completedToday, setCompletedToday] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshed, setRefreshed] = useState<Date | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/interventions?limit=200').then(r => r.json()),
      fetch('/api/inventory?lowStock=true').then(r => r.json()),
      fetch('/api/dashboard/stats').then(r => r.json()),
    ]).then(([r, inv, stats]) => {
      setRepairs(r.data ?? [])
      setLowStock(inv.data ?? [])
      setCompletedToday(stats.completedToday ?? 0)
      setTotalCustomers(stats.totalCustomers ?? 0)
      setRefreshed(new Date())
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const insights = loading ? [] : generateInsights(repairs, lowStock, completedToday, totalCustomers)
  const summary = loading ? '' : buildSummary(repairs, completedToday, totalCustomers, lowStock)

  const criticalCount = insights.filter(i => i.level === 'critical').length
  const warningCount  = insights.filter(i => i.level === 'warning').length

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">IA Insights</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
              Actif
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">Analyse intelligente de votre activité en temps réel</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Summary card */}
      <div className="card p-5 bg-gradient-to-br from-purple-50/60 to-blue-50/40 border-purple-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-1">Résumé du jour</p>
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-3.5 bg-purple-100 rounded w-full animate-pulse" />
                <div className="h-3.5 bg-purple-100 rounded w-3/4 animate-pulse" />
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
            )}
            {refreshed && (
              <p className="text-xs text-gray-400 mt-2">
                Analysé à {refreshed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {!loading && (criticalCount > 0 || warningCount > 0) && (
          <div className="mt-4 flex items-center gap-3 pt-4 border-t border-purple-100">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                <AlertTriangle size={11} />
                {criticalCount} point{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                <AlertTriangle size={11} />
                {warningCount} avertissement{warningCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Insights list */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">
            {loading ? 'Analyse en cours…' : `${insights.length} insight${insights.length !== 1 ? 's' : ''} détecté${insights.length !== 1 ? 's' : ''}`}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-48" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="card p-12 text-center">
            <CheckCircle2 size={32} className="text-green-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Tout est en ordre</p>
            <p className="text-xs text-gray-400 mt-1">Aucune anomalie détectée dans votre activité</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
              const style = LEVEL_STYLES[insight.level]
              const Icon = insight.icon
              return (
                <div
                  key={insight.id}
                  className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
                >
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-white/70 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon size={17} className={style.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${style.badgeBg}`}>
                          {style.badge}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{insight.body}</p>
                      {insight.action && (
                        <Link
                          href={insight.action.href}
                          className={`inline-flex items-center gap-1 mt-2.5 text-xs font-medium ${style.icon} hover:underline`}
                        >
                          {insight.action.label}
                          <ArrowRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
