import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia } from '@/lib/noticias-admin'
import { eliminarLocal, guardarLocal, obtenerLocal } from '@/lib/noticias-locales'
import { datosAviso, errorAviso, notificarNoticia } from '@/lib/notificaciones'
import { esSeccionLocal, nombreSeccion } from '@/lib/secciones'

// Al publicar con "Enviar notificación" se mandan los avisos antes de responder.
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
    return NextResponse.json({ edicion: await obtenerLocal(id) })
  } catch (e) {
    return respuestaError(e)
  }
}

// Actualiza una noticia local (solo web).
export async function PUT(request: Request, { params }: Contexto) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    const cuerpo = await request.json()
    if (!esSeccionLocal(cuerpo?.seccion)) throw new ErrorNoticia('Sección no válida')
    const { edicion, seAcabaDePublicar } = await guardarLocal(id, cuerpo.seccion, cuerpo)
    // Las locales solo avisan si se marco "Enviar notificacion" al publicarla.
    const notificacion =
      seAcabaDePublicar && cuerpo.notificar === true
        ? await notificarNoticia({ ...datosAviso(edicion), ciudad: nombreSeccion(cuerpo.seccion) }).catch(errorAviso)
        : null
    return NextResponse.json({ edicion, notificacion })
  } catch (e) {
    return respuestaError(e)
  }
}

// Borra la noticia local para siempre.
export async function DELETE(_request: Request, { params }: Contexto) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    await eliminarLocal(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return respuestaError(e)
  }
}
