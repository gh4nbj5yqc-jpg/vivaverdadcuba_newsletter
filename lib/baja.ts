import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/sitio'

// Solo servidor. Enlaces de baja firmados con HMAC, uno por suscriptor.
// La firma se deriva de SUPABASE_SERVICE_ROLE_KEY (ya existe en Vercel): sin ese
// secreto nadie puede fabricar el enlace de otra persona. Si algun dia cambias esa
// clave, los enlaces de baja de correos antiguos dejaran de valer (los nuevos si).

// Id especial para la vista previa y el correo de prueba: nunca da de baja a nadie.
export const ID_PRUEBA = 'prueba'

const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function firma(id: string) {
  const secreto = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secreto) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY')
  return createHmac('sha256', secreto).update(`vvc-baja-v1:${id.toLowerCase()}`).digest('hex').slice(0, 32)
}

function parametros(id: string) {
  const p = new URLSearchParams({ s: id })
  if (id !== ID_PRUEBA) p.set('t', firma(id))
  return p.toString()
}

// Pagina que pide confirmar (enlace visible en el pie del correo).
export function urlPaginaBaja(id: string) {
  return `${SITE_URL}/baja?${parametros(id)}`
}

// Endpoint de baja en un clic (cabecera List-Unsubscribe, solo POST).
export function urlBajaUnClic(id: string) {
  return `${SITE_URL}/api/baja?${parametros(id)}`
}

export function cabecerasBaja(id: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${urlBajaUnClic(id)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

export type EnlaceBaja =
  | { tipo: 'prueba' }
  | { tipo: 'valido'; id: string }
  | { tipo: 'invalido' }

export function leerEnlace(s: unknown, t: unknown): EnlaceBaja {
  if (s === ID_PRUEBA) return { tipo: 'prueba' }
  if (typeof s !== 'string' || typeof t !== 'string' || !FORMATO_ID.test(s) || !/^[0-9a-f]{32}$/.test(t)) {
    return { tipo: 'invalido' }
  }
  const esperado = Buffer.from(firma(s))
  const recibido = Buffer.from(t)
  if (recibido.length !== esperado.length || !timingSafeEqual(recibido, esperado)) return { tipo: 'invalido' }
  return { tipo: 'valido', id: s.toLowerCase() }
}

// "alejandro@gmail.com" -> "al•••@gmail.com"
export function enmascarar(email: string) {
  const [local, dominio] = email.split('@')
  if (!dominio) return '•••'
  return `${local.slice(0, Math.min(2, Math.max(1, local.length - 1)))}•••@${dominio}`
}

export async function correoDeSuscriptor(id: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from('subscribers').select('email').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? String(data.email) : null
}

// Borra al suscriptor y cualquier fila repetida con el mismo correo.
// Si ya no existe, no es un error: el resultado es el mismo (no recibira mas correos).
export async function darDeBaja(id: string) {
  const email = await correoDeSuscriptor(id)
  if (!email) return

  const { error } = await supabaseAdmin.from('subscribers').delete().eq('id', id)
  if (error) throw new Error(error.message)

  // Repetidos con exactamente el mismo correo.
  const { error: errorExactos } = await supabaseAdmin.from('subscribers').delete().eq('email', email)
  if (errorExactos) throw new Error(errorExactos.message)

  // Repetidos que solo cambian en mayusculas. Se escapan los comodines de ilike; si el
  // correo tiene "*" (PostgREST lo trata como comodin y no se puede escapar) se omite
  // este paso para no borrar nunca a otra persona.
  if (email.includes('*')) return
  const patron = email.replace(/[\\%_]/g, c => '\\' + c)
  const { error: errorRepetidos } = await supabaseAdmin.from('subscribers').delete().ilike('email', patron)
  if (errorRepetidos) throw new Error(errorRepetidos.message)
}
