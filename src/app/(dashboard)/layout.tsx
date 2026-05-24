'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Wrench, Package, BarChart2,
  Settings, LogOut, Store, ChevronDown, Bell, Sparkles, Menu, X,
  ClipboardCheck, FileText, Receipt, ChevronRight,
} from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants'
import { StoreContext } from '@/contexts/store'
import type { Store as StoreType } from '@/types'

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { href: '/',              label: 'Vue globale',      icon: LayoutDashboard, roles: ['admin','director','employee'] },
      { href: '/customers',     label: 'Clients',          icon: Users,           roles: ['admin','director','employee'] },
      { href: '/interventions', label: 'Interventions',    icon: Wrench,          roles: ['admin','director','employee'] },
      { href: '/inventory',     label: 'Inventaire',       icon: Package,         roles: ['admin','director','employee'] },
    ],
  },
  {
    label: 'Documents',
    items: [
      { href: '/documents/prise-en-charge', label: 'Prises en charge', icon: ClipboardCheck, roles: ['admin','director','employee'] },
      { href: '/documents/devis',           label: 'Devis',            icon: FileText,       roles: ['admin','director','employee'] },
      { href: '/documents/factures',        label: 'Factures',         icon: Receipt,        roles: ['admin','director','employee'] },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { href: '/analytics', label: 'Analytiques', icon: BarChart2, roles: ['admin','director'] },
      { href: '/ai',        label: 'IA Insights', icon: Sparkles,  roles: ['admin','director'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
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
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Chargement…</p>
        </div>
      </div>
    )
  }

  const role = session?.user?.role ?? 'employee'
  const canSeeAllStores = role === 'admin' || role === 'director'

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  const Sidebar = () => (
    <aside className="w-60 bg-[#0f172a] flex flex-col h-full border-r border-[#1e293b]">

      {/* Logo */}
      <div className="px-4 h-16 border-b border-[#1e293b] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">TechCare ERP</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{session?.user?.name}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-slate-400 hover:text-slate-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* Store selector */}
      {canSeeAllStores && (
        <div className="px-3 py-2.5 border-b border-[#1e293b]">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
          >
            <span className="flex items-center gap-2 text-slate-300 truncate min-w-0">
              <Store size={13} className="flex-shrink-0 text-slate-400" />
              <span className="truncate text-xs">{activeStore?.name ?? 'Toutes les boutiques'}</span>
            </span>
            <ChevronDown size={13} className={`text-slate-400 flex-shrink-0 transition-transform ${storeOpen ? 'rotate-180' : ''}`} />
          </button>
          {storeOpen && (
            <div className="mt-1.5 rounded-lg border border-[#1e293b] bg-[#1e2d45] shadow-xl overflow-hidden z-10">
              <button
                onClick={() => { setActiveStore(null); setStoreOpen(false) }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${!activeStore ? 'text-blue-400 font-medium' : 'text-slate-300'}`}
              >
                Toutes les boutiques
              </button>
              {stores.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveStore(s); setStoreOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors border-t border-[#1e293b] ${activeStore?.id === s.id ? 'text-blue-400 font-medium' : 'text-slate-300'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4 scrollbar-thin">
        {NAV_GROUPS.map((group, gi) => {
          const visible = group.items.filter(i => i.roles.includes(role))
          if (visible.length === 0) return null
          return (
            <div key={gi}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visible.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span className="flex-1">{label}</span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
                      {!active && <ChevronRight size={12} className="opacity-0 group-hover:opacity-30 transition-opacity flex-shrink-0" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-[#1e293b] space-y-1">
        <div className="px-3 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-semibold text-xs flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">{session?.user?.name}</p>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-2xl"><Sidebar /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
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
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <StoreContext.Provider value={activeStore}>
            {children}
          </StoreContext.Provider>
        </main>
      </div>
    </div>
  )
}
