import { NextResponse } from 'next/server'
import { ErrorChat, listarMensajes, publicarMensaje } from '@/lib/chat-servidor'

// Siempre se consulta la base de datos (no se genera al compilar).
export const dynamic = 'force-dynamic'

function respuestaError(e: unknown) {
  const err = e instanceof ErrorChat ? e : new ErrorChat('Algo salió mal. Inténtalo de nuevo.', 500)
  return NextResponse.json({ error: err.message }, { status: err.status })
}

// Lista publica de mensajes. Es la misma para todos los visitantes, asi que se deja
// guardar 3 segundos en la red de Vercel: aunque haya mucha gente mirando el chat,
// la base de datos se consulta como mucho una vez cada 3 segundos.
export async function GET() {
  try {
    return NextResponse.json(
      { mensajes: await listarMensajes() },
      { headers: { 'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=5' } }
    )
  } catch (e) {
    return respuestaError(e)
  }
}

// Publica un mensaje. Cualquiera puede escribir: no hace falta cuenta.
export async function POST(request: Request) {
  try {
    const cuerpo = await request.json().catch(() => null)
    return NextResponse.json({ mensaje: await publicarMensaje(cuerpo) })
  } catch (e) {
    return respuestaError(e)
  }
}
