import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { titulo, contenido } = await request.json()

  const { data: suscriptores } = await supabase
    .from('subscribers')
    .select('email')

  if (!suscriptores || suscriptores.length === 0) {
    return NextResponse.json({ error: 'No hay suscriptores' }, { status: 400 })
  }

  const emails = suscriptores.map(s => s.email)

  await resend.emails.send({
    from: 'noticias@vivaverdadcuba.com',
    to: emails,
    subject: titulo,
    text: contenido,

  return NextResponse.json({ ok: true })
}
