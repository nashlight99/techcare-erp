'use client'
import { Sparkles, MessageSquare, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'

const COMING_FEATURES = [
  { icon: MessageSquare, title: 'Résumés automatiques',  desc: 'Synthèse quotidienne de l\'activité' },
  { icon: TrendingUp,    title: 'Prédictions de stock',  desc: 'Anticipez les ruptures de pièces' },
  { icon: AlertTriangle, title: 'Détection d\'anomalies', desc: 'Alertes sur les tickets bloqués' },
  { icon: Lightbulb,     title: 'Recommandations',       desc: 'Optimisation de vos processus' },
]

export default function AIPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">IA Insights</h1>
        <p className="text-sm text-gray-400 mt-0.5">Intelligence artificielle au service de votre activité</p>
      </div>

      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Sparkles size={28} className="text-purple-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">Module IA en développement</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Bientôt, l'intelligence artificielle analysera vos données pour vous fournir des insights
          actionnables et vous aider à prendre de meilleures décisions.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
          {COMING_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon size={15} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
          En cours de développement
        </div>
      </div>
    </div>
  )
}
