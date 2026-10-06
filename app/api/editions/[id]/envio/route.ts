import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { enviarASuscriptores, listarDestinatarios } from '@/lib/correo-envio'
import { ErrorNoticia } from '@/lib/noticias-admin'

// Los envios por lotes pueden tardar: hasta 60 s.
export const maxDuration = 60

function respuestaError(e: unknown) {
  const err = e instanceof ErrorNoticia ? e : new ErrorNoticia('No se pudo completar el envío', 500)
  return NextResponse.json({ error: err.message }, { status: err.status })
}

// Número exacto de destinatarios, para la confirmación antes de enviar.
export async function GET() {
  if (!(await esAdmin())) return noAutorizado()

  try {
    return NextResponse.json({ suscriptores: (await listarDestinatarios()).length })
  } catch (e) {
    return respuestaError(e)
  }
}

// Envía a todos los suscriptores en lotes de 100 (un destinatario por correo).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    const { confirmados } = await request.json()
    if (!Number.isInteger(confirmados) || confirmados <= 0) {
      throw new ErrorNoticia('Falta confirmar el número de suscriptores')
    }
    const resultado = await enviarASuscriptores(id, confirmados)
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 502 })
  } catch (e) {
    return respuestaError(e)
  }
}
