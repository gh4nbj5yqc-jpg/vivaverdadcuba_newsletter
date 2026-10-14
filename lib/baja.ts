import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/sitio'

// Solo servidor. Enlaces de baja firmados con HMAC, uno por suscriptor: sin el secreto
// nadie puede fabricar el enlace de otra persona.
// - BAJA_SECRETO: su propia clave, solo para esto. Firma los enlaces nuevos y los comprueba.
//   Cambiar la service_role de Supabase ya no afecta a estos enlaces.
// - BAJA_SECRETO_ANTERIOR (opcional): la clave con la que se firmaron los correos ya enviados
//   (antes era la service_role). Solo sirve para COMPROBAR esos enlaces antiguos, que asi siguen
//   funcionando. Si la quitas, los enlaces de los correos viejos dejan de valer (los nuevos no).

// Id especial para la vista previa y el correo de prueba: nunca da de baja a nadie.
export const ID_PRUEBA = 'prueba'

const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function secretoActual() {
  const secreto = process.env.BAJA_SECRETO
  if (!secreto) throw new Error('Falta BAJA_SECRETO (la clave de los enlaces de baja)')
  return secreto
}

function firma(id: string, secreto = secretoActual()) {
  return createHmac('sha256', secreto).update(`vvc-baja-v1:${id.toLowerCase()}`).digest('hex').slice(0, 32)
}

// Un enlace vale si su firma coincide con la clave actual o con la anterior.
function firmaValida(id: string, t: string) {
  const secretos = [secretoActual(), process.env.BAJA_SECRETO_ANTERIOR].filter((x): x is string => Boolean(x))
  const recibido = Buffer.from(t)
  return secretos.some(secreto => {
    const esperado = Buffer.from(firma(id, secreto))
    return recibido.length === esperado.length && timingSafeEqual(recibido, esperado)
  })
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
  if (!firmaValida(s, t)) return { tipo: 'invalido' }
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
