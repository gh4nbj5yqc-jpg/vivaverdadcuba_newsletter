import { NextResponse } from 'next/server'
import { darDeBaja, leerEnlace } from '@/lib/baja'

// Baja en un clic (List-Unsubscribe-Post) y boton "Confirmar baja" de la pagina /baja.
// Solo POST: abrir el enlace (GET) nunca da de baja, para que los escaneres de correo no lo hagan.
export async function POST(request: Request) {
  const url = new URL(request.url)
  const enlace = leerEnlace(url.searchParams.get('s'), url.searchParams.get('t'))

  if (enlace.tipo === 'invalido') {
    return NextResponse.json({ error: 'El enlace de baja no es válido.' }, { status: 400 })
  }
  if (enlace.tipo === 'prueba') {
    // Vista previa y correo de prueba: no se toca a ningun suscriptor.
    return NextResponse.json({ ok: true, prueba: true })
  }

  try {
    await darDeBaja(enlace.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No pudimos completar la baja. Inténtalo de nuevo en unos minutos.' }, { status: 500 })
  }
}

// Si algun programa abre la URL de la cabecera con GET, lo llevamos a la pagina de confirmacion.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const destino = new URL('/baja', url)
  for (const clave of ['s', 't']) {
    const valor = url.searchParams.get(clave)
    if (valor) destino.searchParams.set(clave, valor)
  }
  return NextResponse.redirect(destino, 303)
}
