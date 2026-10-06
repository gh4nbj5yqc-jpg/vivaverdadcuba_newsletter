import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { ErrorNoticia, guardarNoticia, listarNoticias } from '@/lib/noticias-admin'

export async function GET() {
  if (!(await esAdmin())) return noAutorizado()

  try {
    return NextResponse.json({ ediciones: await listarNoticias() })
  } catch (e) {
    const err = e as ErrorNoticia
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
  }
}

// Crea una noticia nueva guardando su parte de correo o su parte web.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const cuerpo = await request.json()
    return NextResponse.json({ edicion: await guardarNoticia(null, cuerpo) })
  } catch (e) {
    const err = e instanceof ErrorNoticia ? e : new ErrorNoticia('Datos no válidos')
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
}
