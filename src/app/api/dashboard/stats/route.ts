import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const [totalCustomers, activeRepairs, completedToday, waitingParts] = await Promise.all([
    supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('repair_tickets').select('id', { count: 'exact', head: true }).in('status', ['received', 'in_progress', 'waiting_parts', 'waiting_customer']),
    supabaseAdmin.from('repair_tickets').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', today),
    supabaseAdmin.from('repair_tickets').select('id', { count: 'exact', head: true }).eq('status', 'waiting_parts'),
  ])

  return NextResponse.json({
    totalCustomers: totalCustomers.count ?? 0,
    activeRepairs: activeRepairs.count ?? 0,
    completedToday: completedToday.count ?? 0,
    waitingParts: waitingParts.count ?? 0,
  })
}
