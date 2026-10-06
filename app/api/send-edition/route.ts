import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado()

  const { titulo, contenido, imagenUrl } = await request.json()

  const { data: suscriptores } = await supabase
    .from('subscribers')
    .select('email')

  if (!suscriptores || suscriptores.length === 0) {
    return NextResponse.json({ error: 'No hay suscriptores' }, { status: 400 })
  }

  const emails = suscriptores.map(s => s.email)

  const parrafos = contenido
    .split('\n')
    .filter((p: string) => p.trim() !== '')
    .map((p: string) => `<p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">${p}</p>`)
    .join('')

  const imagenHtml = imagenUrl
    ? `<img src="${imagenUrl}" alt="${titulo}" style="width: 100%; border-radius: 12px; margin-bottom: 24px; display: block;" />`
    : ''

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px;">
      <h1 style="font-size: 28px; font-weight: bold; color: #1a1a1a; margin-bottom: 20px;">${titulo}</h1>
      ${imagenHtml}
      ${parrafos}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
      <p style="font-size: 13px; color: #888;">Viva Verdad Cuba</p>
    </div>
  `

  await resend.emails.send({
    from: 'Viva Verdad Cuba <noticias@vivaverdadcuba.com>',
    to: emails,
    subject: titulo,
    html: html,
  })

  await supabase.from('editions').insert([{
    title: titulo,
    content: contenido,
    image_url: imagenUrl || null,
    sent: true,
  }])

  return NextResponse.json({ ok: true })
}