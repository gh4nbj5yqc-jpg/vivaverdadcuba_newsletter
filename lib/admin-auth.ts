import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'admin_session'

// El valor de la cookie se deriva de ADMIN_PASSWORD: si cambias la contraseña,
// todas las sesiones anteriores dejan de ser validas.
export function adminToken() {
  return createHmac('sha256', process.env.ADMIN_PASSWORD!)
    .update('admin-session')
    .digest('hex')
}

export async function esAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false
  const valor = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!valor) return false
  const esperado = Buffer.from(adminToken())
  const recibido = Buffer.from(valor)
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado)
}

export function noAutorizado() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
