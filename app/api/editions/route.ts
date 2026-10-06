import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'

export async function GET() {
  if (!(await esAdmin())) return noAutorizado()

  const { data, error } = await supabase
    .from('editions')
    .select('id, title, content, image_url, sent, published_at')
    .order('published_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ediciones: data })
}