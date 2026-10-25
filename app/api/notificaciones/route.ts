import { NextResponse } from 'next/server'
import { borrarSuscripcion, endpointValido, guardarSuscripcion, leerSuscripcion } from '@/lib/notificaciones'

// Activar y desactivar las notificaciones de la app. Lo llama el boton de la cabecera
// (components/BotonNotificaciones.tsx) con lo que le da el navegador.

// Activar: guarda la direccion de avisos de este navegador (si ya estaba, la actualiza).
export async function POST(request: Request) {
  const suscripcion = leerSuscripcion(await request.json().catch(() => null))
  if (!suscripcion) return NextResponse.json({ error: 'Datos de notificación no válidos' }, { status: 400 })

  try {
    await guardarSuscripcion(suscripcion)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Notificaciones: no se pudo guardar', e)
    return NextResponse.json({ error: 'No se pudieron activar las notificaciones' }, { status: 500 })
  }
}

// Desactivar: borra la direccion de avisos de este navegador.
export async function DELETE(request: Request) {
  const cuerpo = await request.json().catch(() => null)
  if (!endpointValido(cuerpo?.endpoint)) return NextResponse.json({ error: 'Datos de notificación no válidos' }, { status: 400 })

  try {
    await borrarSuscripcion(cuerpo.endpoint)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Notificaciones: no se pudo borrar', e)
    return NextResponse.json({ error: 'No se pudieron desactivar las notificaciones' }, { status: 500 })
  }
}
