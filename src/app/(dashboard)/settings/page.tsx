'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { User, Store, Users, Shield, ChevronRight, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants'
import { UserModal } from '@/components/users/UserModal'
import type { User as UserType, Store as StoreType } from '@/types'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserType[]>([])
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const role = session?.user?.role ?? 'employee'

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [u, s] = await Promise.all([
      fetch('/api/users?all=true').then(r => r.ok ? r.json() : []),
      fetch('/api/stores').then(r => r.ok ? r.json() : []),
    ])
    setUsers(Array.isArray(u) ? u : [])
    setStores(Array.isArray(s) ? s : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggleActive = async (user: UserType) => {
    setTogglingId(user.id)
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active }),
    })
    await fetchData()
    setTogglingId(null)
  }

  const handleSaved = () => {
    setShowUserModal(false)
    setSelectedUser(null)
    fetchData()
  }

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
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Identifiant</p>
              <p className="font-mono text-xs text-gray-600 truncate">{session?.user?.id}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Rôle</p>
              <p className="text-gray-700 font-medium text-sm">{ROLE_LABELS[role]}</p>
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
            {[1, 2].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
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
              <span className="text-xs text-gray-400">({users.length})</span>
            </div>
            <button
              onClick={() => { setSelectedUser(null); setShowUserModal(true) }}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              <Plus size={13} />Ajouter
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Aucun utilisateur trouvé</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u.id} className={`flex items-center gap-3 px-5 py-3.5 ${!u.is_active ? 'opacity-50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
                    {u.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  {/* Edit */}
                  <button
                    onClick={() => { setSelectedUser(u); setShowUserModal(true) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(u)}
                    disabled={togglingId === u.id || u.id === session?.user?.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 disabled:opacity-30"
                    title={u.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {u.is_active
                      ? <ToggleRight size={18} className="text-green-500" />
                      : <ToggleLeft size={18} className="text-gray-300" />
                    }
                  </button>
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
            { label: 'Changer le mot de passe',           desc: 'Mettre à jour vos identifiants' },
            { label: 'Authentification à deux facteurs',  desc: 'Renforcer la sécurité du compte' },
          ].map(({ label, desc }) => (
            <button key={label} disabled className="w-full flex items-center justify-between px-5 py-3.5 opacity-50 cursor-not-allowed text-left">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => { setShowUserModal(false); setSelectedUser(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
