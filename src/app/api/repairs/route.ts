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

  const { ticket_number: _ignored, ...rest } = body
  const cleanBody = {
    ...rest,
    estimated_cost:   rest.estimated_cost   !== '' ? rest.estimated_cost   ?? null : null,
    final_cost:       rest.final_cost       !== '' ? rest.final_cost       ?? null : null,
    store_id:         rest.store_id         !== '' ? rest.store_id         ?? null : null,
    assigned_user_id: rest.assigned_user_id !== '' ? rest.assigned_user_id ?? null : null,
  }
  const { data, error } = await supabaseAdmin
    .from('repair_tickets')
    .insert(cleanBody)
    .select('*, customers(*), stores(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
