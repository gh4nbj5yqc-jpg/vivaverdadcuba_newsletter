import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { cargarCorreo } from '@/lib/correo-envio'
import { ErrorNoticia } from '@/lib/noticias-admin'

// Vista previa: el HTML se construye en el servidor desde lo guardado,
// con la misma funcion que usa el envio real.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    const { correo } = await cargarCorreo(id)
    return NextResponse.json({ html: correo.html, bytes: correo.bytes, errores: correo.errores, avisos: correo.avisos })
  } catch (e) {
    const err = e instanceof ErrorNoticia ? e : new ErrorNoticia('No se pudo construir el correo', 500)
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
}
