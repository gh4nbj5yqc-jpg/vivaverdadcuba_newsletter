import { supabaseAdmin } from '@/lib/supabase-admin'
import { MAX_IMAGENES, normalizarBloques, tieneTexto, urlImagenPermitida, type Bloque } from '@/lib/bloques'
import { ErrorNoticia, str, type EstadoWeb, type NoticiaAdmin } from '@/lib/noticias-admin'
import type { SeccionLocal } from '@/lib/secciones'

// Solo servidor: noticias locales (Louisville...) para el panel de admin.
// Viven en la tabla noticias_locales, que el codigo del correo no lee nunca:
// por eso una noticia local no se puede enviar por correo de ninguna manera.

export const TABLA_LOCALES = 'noticias_locales'

type FilaLocal = {
  id: string
  seccion: SeccionLocal
  web_title: string | null
  web_cover_url: string | null
  web_blocks: Bloque[]
  web_status: EstadoWeb
  web_published_at: string | null
  updated_at: string | null
}

const COLUMNAS = 'id, seccion, web_title, web_cover_url, web_blocks, web_status, web_published_at, updated_at'

export type NoticiaLocalAdmin = NoticiaAdmin & { seccion: SeccionLocal }

// El panel trabaja con la misma forma que las noticias generales: asi el editor y el
// historial sirven para las dos. Los campos del correo van vacios (nunca hay correo).
function comoNoticia(f: FilaLocal): NoticiaLocalAdmin {
  return {
    ...f,
    id: String(f.id),
    title: null,
    content: null,
    image_url: null,
    sent: false,
    sent_at: null,
    published_at: null,
    blocks: null,
  }
}

export async function listarLocales(seccion: SeccionLocal) {
  const { data, error } = await supabaseAdmin
    .from(TABLA_LOCALES)
    .select(COLUMNAS)
    .eq('seccion', seccion)
    .order('updated_at', { ascending: false })
  if (error) throw new ErrorNoticia(error.message, 500)
  return (data as FilaLocal[]).map(comoNoticia)
}

export async function obtenerLocal(id: string) {
  const { data, error } = await supabaseAdmin.from(TABLA_LOCALES).select(COLUMNAS).eq('id', id).maybeSingle()
  if (error || !data) throw new ErrorNoticia('No se encontró la noticia', 404)
  return comoNoticia(data as FilaLocal)
}

// Guarda la noticia local (solo web). Si id es null, la crea en la seccion indicada.
export async function guardarLocal(id: string | null, seccion: SeccionLocal, cuerpo: Record<string, unknown>) {
  const actual = id ? await obtenerLocal(id) : null
  if (actual && actual.seccion !== seccion) throw new ErrorNoticia('La noticia es de otra sección')
  const ahora = new Date().toISOString()

  let cambios: Record<string, unknown>
  try {
    const estado: EstadoWeb = cuerpo.estado === 'publicada' ? 'publicada' : 'borrador'
    const portada = str(cuerpo.portada, 2000, 'portada')
    if (portada && !urlImagenPermitida(portada)) {
      throw new ErrorNoticia('La imagen de portada no viene del almacenamiento de la newsletter')
    }
    const bloques = normalizarBloques(cuerpo.bloques, 'web', MAX_IMAGENES - (portada ? 1 : 0))
    const titular = str(cuerpo.titulo, 200, 'titular')

    if (estado === 'publicada') {
      if (!titular) throw new ErrorNoticia('Escribe el titular antes de publicar')
      if (!tieneTexto(bloques)) throw new ErrorNoticia('Escribe al menos un párrafo antes de publicar')
    }

    cambios = {
      web_title: titular,
      web_cover_url: portada || null,
      web_blocks: bloques,
      web_status: estado,
      web_published_at: estado === 'publicada' ? actual?.web_published_at ?? ahora : actual?.web_published_at ?? null,
      updated_at: ahora,
    }
  } catch (e) {
    if (e instanceof ErrorNoticia) throw e
    throw new ErrorNoticia(e instanceof Error ? e.message : 'Datos no válidos')
  }

  const consulta = actual
    ? supabaseAdmin.from(TABLA_LOCALES).update(cambios).eq('id', actual.id)
    : supabaseAdmin.from(TABLA_LOCALES).insert([{ ...cambios, seccion }])

  const { data, error } = await consulta.select(COLUMNAS).single()
  if (error) throw new ErrorNoticia(error.message, 500)
  return comoNoticia(data as FilaLocal)
}

const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Borra la noticia local para siempre. Las imagenes del bucket no se tocan.
export async function eliminarLocal(id: string) {
  if (!FORMATO_ID.test(id)) throw new ErrorNoticia('El identificador de la noticia no es válido')
  const { data, error } = await supabaseAdmin.from(TABLA_LOCALES).delete().eq('id', id).select('id')
  if (error) throw new ErrorNoticia(error.message, 500)
  if (!data || data.length === 0) throw new ErrorNoticia('La noticia no existe o ya fue eliminada', 404)
}
