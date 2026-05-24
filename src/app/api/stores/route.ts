import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data, error } = await supabaseAdmin.from('stores').select('*').eq('is_active', true).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { name, address, phone } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('stores')
    .insert({ name: name.trim(), address: address || null, phone: phone || null, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
