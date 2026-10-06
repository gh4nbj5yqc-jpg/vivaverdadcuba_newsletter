import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia, eliminarNoticia, guardarNoticia, obtenerNoticia } from '@/lib/noticias-admin'

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

// Actualiza la parte de correo o la parte web de una noticia existente.
export async function PUT(request: Request, { params }: Contexto) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    const cuerpo = await request.json()
    return NextResponse.json({ edicion: await guardarNoticia(id, cuerpo) })
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
