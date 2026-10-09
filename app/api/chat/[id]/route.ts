import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { borrarMensaje, ErrorChat } from '@/lib/chat-servidor'

// Borra un mensaje del chat. Solo desde el panel de admin.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) return noAutorizado()

  try {
    const { id } = await params
    await borrarMensaje(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const err = e instanceof ErrorChat ? e : new ErrorChat('No se pudo borrar el mensaje.', 500)
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
}
