import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { enviarPrueba } from '@/lib/correo-envio'
import { ErrorNoticia } from '@/lib/noticias-admin'

// Envia UN correo de prueba a la direccion indicada. No marca la noticia como enviada.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    const { email } = await request.json()
    await enviarPrueba(id, String(email ?? '').trim())
    return NextResponse.json({ ok: true })
  } catch (e) {
    const err = e instanceof ErrorNoticia ? e : new ErrorNoticia('No se pudo enviar la prueba', 500)
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
}
