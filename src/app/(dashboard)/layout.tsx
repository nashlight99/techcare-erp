'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Wrench, Package, BarChart2,
  Settings, LogOut, Store, ChevronDown, Bell, Sparkles, Menu, X,
} from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants'
import type { Store as StoreType } from '@/types'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: '/',           label: 'Vue globale',  icon: LayoutDashboard, roles: ['admin','director','employee'] },
      { href: '/customers',  label: 'Clients',      icon: Users,           roles: ['admin','director','employee'] },
      { href: '/repairs',    label: 'Réparations',  icon: Wrench,          roles: ['admin','director','employee'] },
      { href: '/inventory',  label: 'Inventaire',   icon: Package,         roles: ['admin','director','employee'] },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/analytics',  label: 'Analytiques',  icon: BarChart2,  roles: ['admin','director'] },
      { href: '/ai',         label: 'IA Insights',  icon: Sparkles,   roles: ['admin','director'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/settings',   label: 'Paramètres',   icon: Settings,   roles: ['admin'] },
    ],
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession({ required: true })
  const pathname = usePathname()
  const [stores, setStores] = useState<StoreType[]>([])
  const [activeStore, setActiveStore] = useState<StoreType | null>(null)
  const [storeOpen, setStoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {})
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const role = session?.user?.role ?? 'employee'
  const canSeeAllStores = role === 'admin' || role === 'director'

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">TechCare ERP</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{session?.user?.name}</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      {/* Store selector */}
      {canSeeAllStores && (
        <div className="px-3 py-2.5 border-b border-gray-100">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
          >
            <span className="flex items-center gap-2 text-gray-600 truncate min-w-0">
              <Store size={13} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">{activeStore?.name ?? 'Toutes les boutiques'}</span>
            </span>
            <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${storeOpen ? 'rotate-180' : ''}`} />
          </button>
          {storeOpen && (
            <div className="mt-1.5 rounded-lg border border-gray-100 bg-white shadow-lg overflow-hidden z-10">
              <button
                onClick={() => { setActiveStore(null); setStoreOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!activeStore ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
              >
                Toutes les boutiques
              </button>
              {stores.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveStore(s); setStoreOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t border-gray-50 ${activeStore?.id === s.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group, gi) => {
          const visible = group.items.filter(i => i.roles.includes(role))
          if (visible.length === 0) return null
          return (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visible.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />
                      )}
                      <Icon size={16} className="flex-shrink-0" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <div className="px-3 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-800 truncate">{session?.user?.name}</p>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-xl"><Sidebar /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {activeStore?.name ?? 'Toutes les boutiques'}
              </p>
              <p className="text-xs text-gray-400 hidden sm:block capitalize">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            <Bell size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
