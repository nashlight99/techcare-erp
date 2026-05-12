'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LayoutDashboard, Users, Wrench, Package, BarChart2, Settings, LogOut, Store, ChevronDown, Bell, Sparkles, Menu } from 'lucide-react'

const NAV = [
  { href: '/', label: 'Vue globale', icon: LayoutDashboard, roles: ['admin','director','employee'] },
  { href: '/customers', label: 'Clients', icon: Users, roles: ['admin','director','employee'] },
  { href: '/repairs', label: 'Réparations', icon: Wrench, roles: ['admin','director','employee'] },
  { href: '/inventory', label: 'Inventaire', icon: Package, roles: ['admin','director','employee'] },
  { href: '/analytics', label: 'Analytiques', icon: BarChart2, roles: ['admin','director'] },
  { href: '/ai', label: 'IA Insights', icon: Sparkles, roles: ['admin','director'] },
  { href: '/settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession({ required: true })
  const pathname = usePathname()
  const [stores, setStores] = useState<any[]>([])
  const [activeStore, setActiveStore] = useState<any>(null)
  const [storeOpen, setStoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {})
  }, [])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  const role = session?.user?.role ?? 'employee'
  const visibleNav = NAV.filter(n => n.roles.includes(role))
  const canSeeAllStores = role === 'admin' || role === 'director'

  const Sidebar = () => (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">TechCare ERP</p>
            <p className="text-xs text-gray-400 truncate">{session?.user?.name}</p>
          </div>
        </div>
      </div>
      {canSeeAllStores && (
        <div className="px-3 py-2 border-b border-gray-100">
          <button onClick={() => setStoreOpen(!storeOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm">
            <span className="flex items-center gap-2 text-gray-600 truncate"><Store size={13} className="flex-shrink-0" /><span className="truncate">{activeStore?.name ?? 'Toutes les boutiques'}</span></span>
            <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
          </button>
          {storeOpen && (
            <div className="mt-1 rounded-lg border border-gray-100 bg-white shadow-md overflow-hidden">
              <button onClick={() => { setActiveStore(null); setStoreOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">Toutes les boutiques</button>
              {stores.map(s => <button key={s.id} onClick={() => { setActiveStore(s); setStoreOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700 border-t border-gray-50">{s.name}</button>)}
            </div>
          )}
        </div>
      )}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon size={16} />{label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
          <p className="text-xs font-medium text-gray-500 capitalize">{role}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={15} />Déconnexion
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full"><Sidebar /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><Menu size={20} /></button>
            <div>
              <p className="text-sm font-medium text-gray-900">{activeStore?.name ?? 'Toutes les boutiques'}</p>
              <p className="text-xs text-gray-400 hidden sm:block">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"><Bell size={18} /></button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
