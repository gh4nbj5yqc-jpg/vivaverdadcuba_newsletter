import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia, guardarNoticia, listarNoticias } from '@/lib/noticias-admin'
import { datosAviso, errorAviso, notificarNoticia } from '@/lib/notificaciones'

// Al publicar por primera vez se mandan las notificaciones antes de responder.
export const maxDuration = 60

export async function GET() {
  if (!(await esAdmin())) return noAutorizado()

  try {
    return NextResponse.json({ ediciones: await listarNoticias() })
  } catch (e) {
    const err = e as ErrorNoticia
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
  }
}

// Crea una noticia nueva (sirve para la web y para el correo).
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const cuerpo = await request.json()
    const { edicion, primeraPublicacion } = await guardarNoticia(null, cuerpo)
    // Primera vez en la web: se avisa solo, a todos los que activaron las notificaciones.
    const notificacion = primeraPublicacion ? await notificarNoticia(datosAviso(edicion)).catch(errorAviso) : null
    return NextResponse.json({ edicion, notificacion })
  } catch (e) {
    const err = e instanceof ErrorNoticia ? e : new ErrorNoticia('Datos no válidos')
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
}
