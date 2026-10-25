import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia } from '@/lib/noticias-admin'
import { guardarLocal, listarLocales } from '@/lib/noticias-locales'
import { datosAviso, errorAviso, notificarNoticia } from '@/lib/notificaciones'
import { esSeccionLocal, nombreSeccion } from '@/lib/secciones'

// Al publicar con "Enviar notificación" se mandan los avisos antes de responder.
export const maxDuration = 60

// Noticias locales (Louisville...). Solo web: no hay rutas de correo para ellas.

function respuestaError(e: unknown) {
  const err = e instanceof ErrorNoticia ? e : new ErrorNoticia('Datos no válidos')
  return NextResponse.json({ error: err.message }, { status: err.status })
}

export async function GET(request: Request) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const seccion = new URL(request.url).searchParams.get('seccion')
    if (!esSeccionLocal(seccion)) throw new ErrorNoticia('Sección no válida')
    return NextResponse.json({ ediciones: await listarLocales(seccion) })
  } catch (e) {
    return respuestaError(e)
  }
}

// Crea una noticia local nueva en la seccion indicada.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const cuerpo = await request.json()
    if (!esSeccionLocal(cuerpo?.seccion)) throw new ErrorNoticia('Sección no válida')
    const { edicion, seAcabaDePublicar } = await guardarLocal(null, cuerpo.seccion, cuerpo)
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
