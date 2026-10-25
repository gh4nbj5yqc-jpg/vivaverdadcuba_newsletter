import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia, eliminarNoticia, guardarNoticia, obtenerNoticia } from '@/lib/noticias-admin'
import { datosAviso, errorAviso, notificarNoticia } from '@/lib/notificaciones'

// Al publicar por primera vez se mandan las notificaciones antes de responder.
export const maxDuration = 60

type Contexto = { params: Promise<{ id: string }> }

function respuestaError(e: unknown) {
  const err = e instanceof ErrorNoticia ? e : new ErrorNoticia('Datos no válidos')
  return NextResponse.json({ error: err.message }, { status: err.status })
}

export async function GET(_request: Request, { params }: Contexto) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    return NextResponse.json({ edicion: await obtenerNoticia(id) })
  } catch (e) {
    return respuestaError(e)
  }
}

// Actualiza una noticia existente (web y correo a la vez).
export async function PUT(request: Request, { params }: Contexto) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    const cuerpo = await request.json()
    const { edicion, primeraPublicacion } = await guardarNoticia(id, cuerpo)
    // Primera vez en la web: se avisa solo, a todos los que activaron las notificaciones.
    const notificacion = primeraPublicacion ? await notificarNoticia(datosAviso(edicion)).catch(errorAviso) : null
    return NextResponse.json({ edicion, notificacion })
  } catch (e) {
    return respuestaError(e)
  }
}

// Borra la noticia para siempre (su version de correo y su version web).
export async function DELETE(_request: Request, { params }: Contexto) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    await eliminarNoticia(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return respuestaError(e)
  }
}
