import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const all = new URL(req.url).searchParams.get('all') === 'true'
  let query = supabaseAdmin.from('users').select('id, full_name, email, role, store_id, is_active, created_at').order('full_name')
  if (!all) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { email, full_name, password, role, store_id } = await req.json()
  if (!email || !full_name || !password) return NextResponse.json({ error: 'email, full_name et password requis' }, { status: 400 })
  const password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabaseAdmin.from('users').insert({ email, full_name, password_hash, role: role ?? 'employee', store_id }).select('id, full_name, email, role, store_id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
