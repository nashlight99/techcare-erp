'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Store, Users, Shield, ChevronRight } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants'
import type { User as UserType, Store as StoreType } from '@/types'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserType[]>([])
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)

  const role = session?.user?.role ?? 'employee'

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.ok ? r.json() : []),
      fetch('/api/stores').then(r => r.ok ? r.json() : []),
    ]).then(([u, s]) => {
      setUsers(Array.isArray(u) ? u : [])
      setStores(Array.isArray(s) ? s : [])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez votre compte et la configuration du système</p>
      </div>

      {/* Profile */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <User size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Mon profil</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
              {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{session?.user?.name}</p>
              <p className="text-sm text-gray-400">{session?.user?.email}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Identifiant</p>
              <p className="font-mono text-xs text-gray-600 truncate">{session?.user?.id}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Rôle</p>
              <p className="text-gray-700 font-medium">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stores */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Boutiques</h2>
          </div>
          <span className="text-xs text-gray-400">{stores.length} boutique{stores.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Aucune boutique configurée</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {stores.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  {s.address && <p className="text-xs text-gray-400 mt-0.5">{s.address}</p>}
                </div>
                <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-medium">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users — admin only */}
      {role === 'admin' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Utilisateurs</h2>
            </div>
            <span className="text-xs text-gray-400">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Aucun utilisateur trouvé</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((u: UserType) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
                    {u.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    {!u.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded">Inactif</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Sécurité</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Changer le mot de passe',     desc: 'Mettre à jour vos identifiants' },
            { label: 'Authentification à deux facteurs', desc: 'Renforcer la sécurité du compte' },
          ].map(({ label, desc }) => (
            <button key={label} disabled className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed text-left">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
