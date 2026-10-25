import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { limpiarClave } from '@/lib/clave-vapid'
import { NOMBRE_SITIO } from '@/lib/sitio'

// Solo servidor: notificaciones push de la app. Quien las activa queda en la tabla
// notificaciones_suscripciones (supabase/notificaciones.sql); no se guarda ni nombre ni correo.
// Las claves VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT) identifican
// a Viva Verdad Cuba ante Apple, Google y Mozilla al mandar los avisos.

export const TABLA_NOTIFICACIONES = 'notificaciones_suscripciones'

// Lo que se le cuenta al panel despues de avisar: a cuantos les llego.
// error: no se pudo avisar a nadie (faltan las claves o fallo la base de datos).
export type ResultadoNotificacion = { enviadas: number; total: number } | { error: string }

export type Suscripcion = { endpoint: string; p256dh: string; auth: string }

// Solo se aceptan direcciones de los servicios de avisos de los navegadores. Asi nadie puede
// guardar una direccion cualquiera para que el servidor le haga peticiones.
const SERVICIOS = [
  /^(fcm|android)\.googleapis\.com$/, // Chrome, Android, Edge en Android, Samsung Internet
  /^[a-z0-9-]+\.google\.com$/, // Chrome y Chromium tambien usan direcciones como jmt17.google.com
  /^([a-z0-9-]+\.)?push\.apple\.com$/, // Safari en iPhone, iPad y Mac (web.push.apple.com)
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^[a-z0-9-]+\.notify\.windows\.com$/, // Edge en Windows
]

const textoEntre = (v: unknown, min: number, max: number) => typeof v === 'string' && v.length >= min && v.length <= max

// Comprueba lo que manda el navegador (PushSubscription.toJSON()). null si no vale.
export function leerSuscripcion(cuerpo: unknown): Suscripcion | null {
  const s = cuerpo as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null
  if (!s || !textoEntre(s.endpoint, 20, 1000) || !textoEntre(s.keys?.p256dh, 20, 200) || !textoEntre(s.keys?.auth, 8, 100)) {
    return null
  }
  try {
    const url = new URL(s.endpoint as string)
    if (url.protocol !== 'https:' || !SERVICIOS.some(r => r.test(url.hostname))) return null
  } catch {
    return null
  }
  return { endpoint: s.endpoint as string, p256dh: s.keys!.p256dh as string, auth: s.keys!.auth as string }
}

export function endpointValido(v: unknown): v is string {
  return textoEntre(v, 20, 1000)
}

export async function guardarSuscripcion(s: Suscripcion) {
  const { error } = await supabaseAdmin.from(TABLA_NOTIFICACIONES).upsert([s], { onConflict: 'endpoint' })
  if (error) throw new Error(error.message)
}

export async function borrarSuscripcion(endpoint: string) {
  const { error } = await supabaseAdmin.from(TABLA_NOTIFICACIONES).delete().eq('endpoint', endpoint)
  if (error) throw new Error(error.message)
}

function clavesListas() {
  // Limpias de espacios, saltos de linea y comillas que se pudieran colar al pegarlas en Vercel.
  const publica = limpiarClave(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  const privada = limpiarClave(process.env.VAPID_PRIVATE_KEY)
  const contacto = limpiarClave(process.env.VAPID_SUBJECT)
  if (!publica || !privada || !contacto) return false
  webpush.setVapidDetails(contacto, publica, privada)
  return true
}

// Lo que lleva el aviso de una noticia recien guardada.
export function datosAviso(n: { id: string; web_title: string | null; web_cover_url: string | null }) {
  return { id: String(n.id), titular: n.web_title ?? '', portada: n.web_cover_url }
}

// Si avisar falla del todo, la noticia ya quedo publicada: solo se le cuenta al panel.
export function errorAviso(e: unknown): ResultadoNotificacion {
  console.error('Notificación: falló el envío', e)
  return { error: 'No se pudieron enviar las notificaciones.' }
}

// Cuantos avisos salen a la vez. Los servicios de avisos aguantan muchos, pero asi el servidor no se satura.
const A_LA_VEZ = 50

// Avisa a todos los que activaron las notificaciones de que hay una noticia nueva.
// Al tocar el aviso se abre esa noticia (lo hace public/sw.js con "url").
export async function notificarNoticia(noticia: {
  id: string
  titular: string
  portada: string | null
  ciudad?: string
}): Promise<ResultadoNotificacion> {
  if (!clavesListas()) return { error: 'Faltan las claves de las notificaciones (VAPID) en el servidor.' }

  const { data, error } = await supabaseAdmin.from(TABLA_NOTIFICACIONES).select('endpoint, p256dh, auth')
  if (error) return { error: `No se pudo leer la lista de notificaciones: ${error.message}` }
  const suscripciones = data as Suscripcion[]

  const aviso = JSON.stringify({
    titulo: noticia.ciudad ? `${NOMBRE_SITIO} · ${noticia.ciudad}` : NOMBRE_SITIO,
    texto: noticia.titular,
    imagen: noticia.portada,
    url: `/noticias/${encodeURIComponent(noticia.id)}`,
    // Si llegan dos avisos de la misma noticia, el segundo reemplaza al primero.
    etiqueta: `noticia-${noticia.id}`,
  })

  let enviadas = 0
  const caducadas: string[] = []
  for (let i = 0; i < suscripciones.length; i += A_LA_VEZ) {
    const lote = suscripciones.slice(i, i + A_LA_VEZ)
    const resultados = await Promise.allSettled(
      lote.map(s =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, aviso, {
          // Si el telefono esta apagado, el aviso espera hasta un dia; despues ya no es noticia.
          TTL: 60 * 60 * 24,
          urgency: 'high',
        })
      )
    )
    resultados.forEach((r, j) => {
      if (r.status === 'fulfilled') enviadas++
      else {
        const codigo = (r.reason as { statusCode?: number })?.statusCode
        // 404 y 410: la persona desactivo los avisos o desinstalo la app. Esa direccion ya no sirve.
        if (codigo === 404 || codigo === 410) caducadas.push(lote[j].endpoint)
        else console.error('Notificación: no se pudo enviar', codigo, (r.reason as Error)?.message)
      }
    })
  }

  if (caducadas.length) {
    const { error: errorBorrar } = await supabaseAdmin.from(TABLA_NOTIFICACIONES).delete().in('endpoint', caducadas)
    if (errorBorrar) console.error('Notificación: no se pudieron borrar las caducadas', errorBorrar.message)
  }

  return { enviadas, total: suscripciones.length }
}
