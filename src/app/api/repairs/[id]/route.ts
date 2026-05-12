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
