import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'

export async function GET() {
  if (!(await esAdmin())) return noAutorizado()

  const { data, error } = await supabase
    .from('subscribers')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ suscriptores: data })
}

export async function DELETE(request: Request) {
  if (!(await esAdmin())) return noAutorizado()

  const { id } = await request.json()

  const { error } = await supabase
    .from('subscribers')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}