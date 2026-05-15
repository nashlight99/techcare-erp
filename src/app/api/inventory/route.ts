import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const storeId = searchParams.get('storeId') ?? ''
  const lowStock = searchParams.get('lowStock') === 'true'

  let query = supabaseAdmin
    .from('inventory')
    .select('*, stores(id, name)', { count: 'exact' })
    .order('name')

  if (search) query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)
  if (storeId) query = query.eq('store_id', storeId)
  if (lowStock) query = query.lte('quantity', supabaseAdmin.rpc as any)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = lowStock ? (data ?? []).filter((i: any) => i.quantity <= i.min_quantity) : data
  return NextResponse.json({ data: items, total: lowStock ? items.length : count })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('inventory')
    .insert({ ...body, store_id: body.store_id || null })
    .select('*, stores(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
