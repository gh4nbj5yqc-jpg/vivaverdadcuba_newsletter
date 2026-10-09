import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  bloquesDeCorreo,
  ID_PORTADA,
  ID_TITULAR,
  MAX_IMAGENES,
  normalizarBloques,
  nuevoId,
  textoPlano,
  tieneTexto,
  urlImagenPermitida,
  type Bloque,
} from '@/lib/bloques'

// Solo servidor: lectura y guardado de noticias para el panel de admin.

export type EstadoWeb = 'borrador' | 'publicada'

export type NoticiaAdmin = {
  id: string
  title: string | null
  content: string | null
  image_url: string | null
  sent: boolean | null
  sent_at: string | null
  published_at: string | null
  updated_at: string | null
  blocks: Bloque[] | null
  web_title: string | null
  web_cover_url: string | null
  web_blocks: Bloque[] | null
  web_status: EstadoWeb
  web_published_at: string | null
}

const COLUMNAS =
  'id, title, content, image_url, sent, sent_at, published_at, updated_at, blocks, web_title, web_cover_url, web_blocks, web_status, web_published_at'

// Una edicion antigua no tiene bloques de correo ni de web.
export function esAntigua(n: Pick<NoticiaAdmin, 'blocks' | 'web_blocks'>) {
  return n.blocks === null && n.web_blocks === null
}

export class ErrorNoticia extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export async function listarNoticias() {
  const { data, error } = await supabaseAdmin
    .from('editions')
    .select(COLUMNAS)
    .order('updated_at', { ascending: false })
  if (error) throw new ErrorNoticia(error.message, 500)
  return data as NoticiaAdmin[]
}

export async function obtenerNoticia(id: string) {
  const { data, error } = await supabaseAdmin.from('editions').select(COLUMNAS).eq('id', id).maybeSingle()
  if (error) throw new ErrorNoticia('No se encontró la noticia', 404)
  if (!data) throw new ErrorNoticia('No se encontró la noticia', 404)
  return data as NoticiaAdmin
}

export async function idsPublicados(ids: string[]) {
  if (ids.length === 0) return new Set<string>()
  const { data, error } = await supabaseAdmin
    .from('editions')
    .select('id')
    .eq('web_status', 'publicada')
    .in('id', ids)
  if (error) throw new ErrorNoticia(error.message, 500)
  return new Set(data.map(d => String(d.id)))
}

function str(valor: unknown, max: number, campo: string) {
  if (valor === undefined || valor === null) return ''
  if (typeof valor !== 'string') throw new ErrorNoticia(`El campo ${campo} no es texto`)
  const limpio = valor.trim()
  if (limpio.length > max) throw new ErrorNoticia(`El campo ${campo} pasa de ${max} caracteres`)
  return limpio
}

// Guarda la noticia. Se escribe una sola vez y sirve para la web y para el correo:
// el correo lleva el titular, la portada y el mismo contenido. Si id es null, crea la noticia.
export async function guardarNoticia(id: string | null, cuerpo: Record<string, unknown>) {
  const actual = id ? await obtenerNoticia(id) : null
  if (actual && esAntigua(actual)) {
    throw new ErrorNoticia('Las ediciones antiguas no se pueden editar con el editor de bloques')
  }

  const ahora = new Date().toISOString()
  let cambios: Record<string, unknown>

  try {
    const estado: EstadoWeb = cuerpo.estado === 'publicada' ? 'publicada' : 'borrador'
    const portada = str(cuerpo.portada, 2000, 'portada')
    if (portada && !urlImagenPermitida(portada)) {
      throw new ErrorNoticia('La imagen de portada no viene del almacenamiento de la newsletter')
    }
    // Los ids "titular" y "portada" estan reservados para la cabecera del correo.
    const bloques = normalizarBloques(cuerpo.bloques, 'web', MAX_IMAGENES - (portada ? 1 : 0)).map(b =>
      b.id === ID_TITULAR || b.id === ID_PORTADA ? { ...b, id: nuevoId() } : b
    )
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
    }

    // El correo lleva lo mismo que la web. Si ya se envio, se conserva tal como salio:
    // los cambios posteriores solo afectan a la web.
    if (!actual?.sent) {
      const correo = bloquesDeCorreo(titular, portada, bloques)
      cambios.title = titular
      cambios.content = textoPlano(correo)
      cambios.blocks = correo
    }
  } catch (e) {
    if (e instanceof ErrorNoticia) throw e
    throw new ErrorNoticia(e instanceof Error ? e.message : 'Datos no válidos')
  }

  cambios.updated_at = ahora

  const consulta = actual
    ? supabaseAdmin.from('editions').update(cambios).eq('id', actual.id)
    : supabaseAdmin.from('editions').insert([{ ...cambios, sent: false }])

  const { data, error } = await consulta.select(COLUMNAS).single()
  if (error) throw new ErrorNoticia(error.message, 500)
  return data as NoticiaAdmin
}

const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Borra la noticia completa (correo y web). Las imagenes del bucket no se tocan.
export async function eliminarNoticia(id: string) {
  if (!FORMATO_ID.test(id)) throw new ErrorNoticia('El identificador de la noticia no es válido')

  const { data, error } = await supabaseAdmin.from('editions').delete().eq('id', id).select('id')
  if (error) throw new ErrorNoticia(error.message, 500)
  if (!data || data.length === 0) throw new ErrorNoticia('La noticia no existe o ya fue eliminada', 404)
}
