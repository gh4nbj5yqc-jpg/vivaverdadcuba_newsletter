import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia } from '@/lib/noticias-admin'
import { eliminarLocal, guardarLocal, obtenerLocal } from '@/lib/noticias-locales'
import { esSeccionLocal } from '@/lib/secciones'

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
    return NextResponse.json({ edicion: await guardarLocal(id, cuerpo.seccion, cuerpo) })
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
