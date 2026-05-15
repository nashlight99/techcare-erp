import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { full_name, email, role, store_id, password } = await req.json()
  const update: Record<string, any> = { full_name, email, role, store_id: store_id || null }
  if (password) update.password_hash = await bcrypt.hash(password, 10)

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('id', params.id)
    .select('id, full_name, email, role, store_id, is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { is_active } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_active })
    .eq('id', params.id)
    .select('id, full_name, email, role, store_id, is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
