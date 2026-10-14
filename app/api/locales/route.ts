import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia } from '@/lib/noticias-admin'
import { guardarLocal, listarLocales } from '@/lib/noticias-locales'
import { esSeccionLocal } from '@/lib/secciones'

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
    return NextResponse.json({ edicion: await guardarLocal(null, cuerpo.seccion, cuerpo) })
  } catch (e) {
    return respuestaError(e)
  }
}
