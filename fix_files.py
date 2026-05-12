import os

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f'OK: {path}')

write('src/components/customers/CustomerModal.tsx', """\
'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const TAGS = ['premium', 'repair_client', 'buyer', 'vip', 'pro']
const SUBSCRIPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: 'high_tech_care', label: 'High-Tech Care' },
  { value: 'premium', label: 'Premium' },
]

interface Props { customer?: any; onClose: () => void; onSaved: () => void }

export function CustomerModal({ customer, onClose, onSaved }: Props) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState({
    first_name: customer?.first_name ?? '',
    last_name: customer?.last_name ?? '',
    phone: customer?.phone ?? '',
    whatsapp_available: customer?.whatsapp_available ?? false,
    email: customer?.email ?? '',
    address: customer?.address ?? '',
    tags: customer?.tags ?? [] as string[],
    subscription_status: customer?.subscription_status ?? 'none',
    notes: customer?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleTag = (tag: string) => set('tags', form.tags.includes(tag) ? form.tags.filter((t: string) => t !== tag) : [...form.tags, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/customers/${customer.id}` : '/api/customers'
      const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!r.ok) throw new Error(await r.text())
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Prénom</label><input className="input" placeholder="Jean" value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
              <div><label className="label">Nom</label><input className="input" placeholder="Dupont" value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
            </div>
            <div>
              <label className="label">Téléphone</label>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="+33 6 12 34 56 78" value={form.phone} onChange={e => set('phone', e.target.value)} />
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm text-gray-600 whitespace-nowrap">
                  <input type="checkbox" checked={form.whatsapp_available} onChange={e => set('whatsapp_available', e.target.checked)} className="accent-green-600" />WhatsApp
                </label>
              </div>
            </div>
            <div><label className="label">Email</label><input className="input" type="email" placeholder="jean@example.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Adresse</label><input className="input" placeholder="12 rue..." value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.tags.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>{tag}</button>
                ))}
              </div>
            </div>
            <div><label className="label">Abonnement</label>
              <select className="input" value={form.subscription_status} onChange={e => set('subscription_status', e.target.value)}>
                {SUBSCRIPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="label">Notes internes</label><textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
""")

write('src/app/(dashboard)/page.tsx', """\
'use client'
import { useEffect, useState } from 'react'
import { Wrench, Users, CheckCircle2, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/repairs?limit=5').then(r => r.json()),
    ]).then(([s, t]) => {
      setStats(s)
      setRecentTickets(t.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: 'Total clients', value: stats.totalCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Réparations actives', value: stats.activeRepairs, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: "Terminées aujourd'hui", value: stats.completedToday, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Attente pièces', value: stats.waitingParts, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : []

  const statusColors: Record<string, string> = {
    received: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    waiting_parts: 'bg-yellow-100 text-yellow-700',
    waiting_customer: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const statusLabels: Record<string, string> = {
    received: 'Reçu', in_progress: 'En cours', waiting_parts: 'Attente pièces',
    waiting_customer: 'Attente client', completed: 'Terminé', cancelled: 'Annulé',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Vue globale</h1>
        <p className="text-sm text-gray-400 mt-0.5">Bienvenue sur votre tableau de bord</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse"><div className="w-8 h-8 bg-gray-100 rounded-lg mb-3" /><div className="h-7 bg-gray-100 rounded w-16 mb-1" /><div className="h-4 bg-gray-100 rounded w-24" /></div>
        )) : kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}><Icon size={18} className={color} /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tickets récents</h2>
          <a href="/repairs" className="text-xs text-blue-600 hover:underline">Voir tout</a>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : recentTickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Aucun ticket pour le moment</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTickets.map((t: any) => (
              <a key={t.id} href={`/repairs/${t.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-600">{t.ticket_number}</span>
                    <span className={`badge ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 truncate">{t.customers?.first_name} {t.customers?.last_name} — {t.device_brand} {t.device_model}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
""")

write('src/app/(dashboard)/layout.tsx', """\
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
""")

write('src/app/api/repairs/route.ts', """\
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const storeId = searchParams.get('storeId')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '40'), 100)
  const page = Math.max(parseInt(searchParams.get('page') ?? '1'), 1)

  let query = supabaseAdmin
    .from('repair_tickets')
    .select('*, customers(id, first_name, last_name, phone, whatsapp_available, email), users:assigned_user_id(id, full_name), stores(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)
  if (storeId) query = query.eq('store_id', storeId)
  if (search) query = query.or(`ticket_number.ilike.%${search}%,device_brand.ilike.%${search}%,device_model.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  if (!body.customer_id || !body.issue_description) {
    return NextResponse.json({ error: 'customer_id et issue_description sont requis' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('repair_tickets')
    .insert({ ...body, ticket_number: '' })
    .select('*, customers(*), stores(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
""")

write('src/app/api/repairs/[id]/route.ts', """\
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data, error } = await supabaseAdmin.from('repair_tickets').select('*, customers(*), users:assigned_user_id(*), stores(*), repair_status_history(*)').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('repair_tickets').update(body).eq('id', params.id).select('*, customers(*), stores(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await req.json()
  const { data: old } = await supabaseAdmin.from('repair_tickets').select('status').eq('id', params.id).single()
  const update: any = { ...body }
  if (body.status === 'completed') update.completed_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('repair_tickets').update(update).eq('id', params.id).select('*, customers(*), stores(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (body.status && old?.status !== body.status) {
    await supabaseAdmin.from('repair_status_history').insert({ ticket_id: params.id, old_status: old?.status, new_status: body.status, changed_by: session.user.id })
  }
  return NextResponse.json(data)
}
""")

write('src/app/(dashboard)/repairs/page.tsx', """\
'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { RepairModal } from '@/components/repairs/RepairModal'

export const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_parts: 'bg-yellow-100 text-yellow-700',
  waiting_customer: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}
export const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu', in_progress: 'En cours', waiting_parts: 'Attente pièces',
  waiting_customer: 'Attente client', completed: 'Terminé', cancelled: 'Annulé',
}
const STATUSES = Object.entries(STATUS_LABELS)

export default function RepairsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ ...(search && { search }), ...(filterStatus && { status: filterStatus }), limit: '40' })
    const r = await fetch(`/api/repairs?${params}`)
    const d = await r.json()
    setTickets(d.data ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => {
    const t = setTimeout(fetchTickets, 300)
    return () => clearTimeout(t)
  }, [fetchTickets])

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/repairs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    fetchTickets()
  }

  const handleSaved = () => { setShowModal(false); setSelected(null); fetchTickets() }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Réparations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} ticket{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setSelected(null); setShowModal(true) }} className="btn-primary"><Plus size={16} />Nouveau ticket</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input pl-9" placeholder="Ticket, client, appareil..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 animate-pulse flex gap-4"><div className="w-24 h-4 bg-gray-100 rounded" /><div className="flex-1 h-4 bg-gray-100 rounded" /></div>)}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center"><p className="text-sm text-gray-400">Aucun ticket trouvé</p></div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">{['Ticket','Client','Appareil','Statut','Date','Action'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{t.ticket_number}</td>
                      <td className="px-4 py-3 text-gray-900">{t.customers?.first_name} {t.customers?.last_name}</td>
                      <td className="px-4 py-3 text-gray-600">{t.device_brand} {t.device_model}</td>
                      <td className="px-4 py-3"><span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <select value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none">
                          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {tickets.map((t: any) => (
                <div key={t.id} className="px-4 py-4 cursor-pointer" onClick={() => { setSelected(t); setShowModal(true) }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-blue-600">{t.ticket_number}</span>
                    <span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{t.customers?.first_name} {t.customers?.last_name}</p>
                  <p className="text-xs text-gray-500">{t.device_brand} {t.device_model}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {showModal && <RepairModal ticket={selected} onClose={() => { setShowModal(false); setSelected(null) }} onSaved={handleSaved} />}
    </div>
  )
}
""")

write('src/components/repairs/RepairModal.tsx', """\
'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Search } from 'lucide-react'
import { STATUS_LABELS } from '@/app/(dashboard)/repairs/page'

const STATUSES = Object.entries(STATUS_LABELS)

interface Props { ticket?: any; onClose: () => void; onSaved: () => void }

export function RepairModal({ ticket, onClose, onSaved }: Props) {
  const isEdit = !!ticket?.id
  const [form, setForm] = useState({
    customer_id: ticket?.customer_id ?? '',
    store_id: ticket?.store_id ?? '',
    assigned_user_id: ticket?.assigned_user_id ?? '',
    device_brand: ticket?.device_brand ?? '',
    device_model: ticket?.device_model ?? '',
    serial_number: ticket?.serial_number ?? '',
    imei: ticket?.imei ?? '',
    issue_description: ticket?.issue_description ?? '',
    status: ticket?.status ?? 'received',
    estimated_cost: ticket?.estimated_cost ?? '',
    final_cost: ticket?.final_cost ?? '',
    internal_notes: ticket?.internal_notes ?? '',
  })
  const [customerSearch, setCustomerSearch] = useState(ticket ? `${ticket.customers?.first_name ?? ''} ${ticket.customers?.last_name ?? ''}`.trim() : '')
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {})
    fetch('/api/users').then(r => r.json()).then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&limit=5`)
      const d = await r.json()
      setCustomerResults(d.data ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id) { setError('Veuillez sélectionner un client'); return }
    if (!form.issue_description) { setError('La description du problème est requise'); return }
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/repairs/${ticket.id}` : '/api/repairs'
      const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!r.ok) throw new Error(await r.text())
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? `Ticket ${ticket.ticket_number}` : 'Nouveau ticket de réparation'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            <div className="relative">
              <label className="label">Client <span className="text-red-500">*</span></label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input className="input pl-9" placeholder="Rechercher un client..." value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); set('customer_id', '') }} />
              </div>
              {customerResults.length > 0 && !form.customer_id && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                  {customerResults.map((c: any) => (
                    <button key={c.id} type="button" onClick={() => { set('customer_id', c.id); setCustomerSearch(`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()); setCustomerResults([]) }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">
                      <span className="font-medium">{c.first_name} {c.last_name}</span>{c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
              {form.customer_id && <p className="text-xs text-green-600 mt-1">✓ Client sélectionné</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Boutique</label>
                <select className="input" value={form.store_id} onChange={e => set('store_id', e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="label">Technicien</label>
                <select className="input" value={form.assigned_user_id} onChange={e => set('assigned_user_id', e.target.value)}>
                  <option value="">Non assigné</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Marque</label><input className="input" placeholder="Apple, Samsung..." value={form.device_brand} onChange={e => set('device_brand', e.target.value)} /></div>
              <div><label className="label">Modèle</label><input className="input" placeholder="iPhone 15..." value={form.device_model} onChange={e => set('device_model', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Numéro de série</label><input className="input font-mono text-xs" placeholder="SN..." value={form.serial_number} onChange={e => set('serial_number', e.target.value)} /></div>
              <div><label className="label">IMEI</label><input className="input font-mono text-xs" placeholder="35..." value={form.imei} onChange={e => set('imei', e.target.value)} /></div>
            </div>
            <div><label className="label">Description du problème <span className="text-red-500">*</span></label>
              <textarea className="input resize-none" rows={3} placeholder="Décrivez le problème..." value={form.issue_description} onChange={e => set('issue_description', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Statut</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div><label className="label">Devis (€)</label><input className="input" type="number" step="0.01" placeholder="0.00" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} /></div>
              <div><label className="label">Prix final (€)</label><input className="input" type="number" step="0.01" placeholder="0.00" value={form.final_cost} onChange={e => set('final_cost', e.target.value)} /></div>
            </div>
            <div><label className="label">Notes internes</label><textarea className="input resize-none" rows={2} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} /></div>
            {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer le ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
""")

print("Tous les fichiers créés avec succès !")

write('src/app/(auth)/login/page.tsx', """\
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Wrench } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Email ou mot de passe incorrect.')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Wrench className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TechCare ERP</h1>
          <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre espace</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Adresse email</label>
              <input type="email" className="input" placeholder="admin@techcare.fr" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">TechCare ERP © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
""")
print("Login page recréée !")

write('src/lib/constants.ts', """\
export const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_parts: 'bg-yellow-100 text-yellow-700',
  waiting_customer: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu',
  in_progress: 'En cours',
  waiting_parts: 'Attente pièces',
  waiting_customer: 'Attente client',
  completed: 'Terminé',
  cancelled: 'Annulé',
}
""")
print("constants.ts créé !")

write('src/middleware.ts', """\
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico).*)'],
}
""")

write('src/app/page.tsx', """\
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/')
}
""")
print("Middleware et root page créés !")

write('src/lib/auth.ts', """\
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        console.log('AUTH ATTEMPT:', credentials?.email)
        if (!credentials?.email || !credentials?.password) {
          console.log('AUTH ERROR: missing credentials')
          return null
        }
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, password_hash, role, store_id, permissions, is_active')
          .eq('email', credentials.email)
          .single()

        console.log('USER FOUND:', user ? 'yes' : 'no', 'ERROR:', error?.message)

        if (!user || !user.is_active)
cat >> fix_files.py << 'PYEOF'

write('src/lib/auth.ts', """\
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        console.log('AUTH ATTEMPT:', credentials?.email)
        if (!credentials?.email || !credentials?.password) {
          console.log('AUTH ERROR: missing credentials')
          return null
        }
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, password_hash, role, store_id, permissions, is_active')
          .eq('email', credentials.email)
          .single()

        console.log('USER FOUND:', user ? 'yes' : 'no', 'ERROR:', error?.message)

        if (!user || !user.is_active) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        console.log('PASSWORD VALID:', valid)

        if (!valid) return null

        await supabaseAdmin.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          storeId: user.store_id,
          permissions: user.permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.storeId = (user as any).storeId
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.storeId = token.storeId as string | null
      session.user.permissions = token.permissions as any
      return session
    },
  },
}

declare module 'next-auth' {
  interface User {
    role: string
    storeId: string | null
    permissions: Record<string, boolean>
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      storeId: string | null
      permissions: Record<string, boolean>
    }
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    storeId: string | null
    permissions: Record<string, boolean>
  }
}
""")
print("auth.ts avec debug créé !")
