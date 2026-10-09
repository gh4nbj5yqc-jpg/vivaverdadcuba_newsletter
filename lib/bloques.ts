// Modelo de bloques compartido por el panel, el servidor, la web y el correo.
// No importa nada del servidor: se puede usar tambien en el navegador.

export type BloqueImagen = {
  id: string
  tipo: 'imagen'
  url: string
  alt: string
  pie: string
  etiqueta?: string
}

export type BloqueTexto = {
  id: string
  tipo: 'texto'
  subtitulo: string
  texto: string
  // Solo en el correo: id del articulo web publicado al que lleva el boton.
  enlaceId?: string | null
  etiqueta?: string
}

export type Bloque = BloqueImagen | BloqueTexto
export type Modo = 'correo' | 'web'

export const MAX_IMAGENES = 12
export const MAX_BLOQUES = 60
const LIMITES = { alt: 300, pie: 500, subtitulo: 200, texto: 20000, etiqueta: 60 }

export function nuevoId() {
  return crypto.randomUUID()
}

export function bloqueImagen(etiqueta?: string): BloqueImagen {
  return { id: nuevoId(), tipo: 'imagen', url: '', alt: '', pie: '', etiqueta }
}

export function bloqueTexto(etiqueta?: string): BloqueTexto {
  return { id: nuevoId(), tipo: 'texto', subtitulo: '', texto: '', enlaceId: null, etiqueta }
}

export function estructuraInicial(): Bloque[] {
  return [
    bloqueImagen('Imagen de presentación'),
    bloqueTexto('Introducción'),
    bloqueImagen('Imagen'),
    bloqueTexto('Noticia 1'),
    bloqueImagen('Imagen'),
    bloqueTexto('Noticia 2'),
  ]
}

// Prefijo de las URLs publicas del bucket newsletter-images.
export function prefijoBucket() {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  return `${base}/storage/v1/object/public/newsletter-images/`
}

export function urlImagenPermitida(url: string) {
  return (
    url.startsWith(prefijoBucket()) &&
    url.startsWith('https://') &&
    !url.includes('..') &&
    !/[\s"'<>\\]/.test(url)
  )
}

// Separa el texto de un bloque en parrafos (cada salto de linea es un parrafo).
export function parrafos(texto: string) {
  return texto.split('\n').map(p => p.trim()).filter(p => p !== '')
}

// Bloques que se pueden mostrar: imagenes con URL valida y textos con contenido.
export function bloquesVisibles(bloques: Bloque[]) {
  return bloques.filter(b =>
    b.tipo === 'imagen' ? Boolean(b.url) && urlImagenPermitida(b.url) : Boolean(b.subtitulo.trim() || parrafos(b.texto).length)
  )
}

// --- Correo de una noticia ---
// La noticia se escribe UNA sola vez. El correo se arma con estos bloques:
// titular + portada (si hay) + el mismo contenido que sale en la web.
// Titular y portada llevan un id fijo para poder reconocerlos despues.
export const ID_TITULAR = 'titular'
export const ID_PORTADA = 'portada'

export function bloquesDeCorreo(titular: string, portada: string | null, bloques: Bloque[]): Bloque[] {
  const cabecera: Bloque[] = []
  if (titular) cabecera.push({ id: ID_TITULAR, tipo: 'texto', subtitulo: titular, texto: '', enlaceId: null })
  if (portada) cabecera.push({ id: ID_PORTADA, tipo: 'imagen', url: portada, alt: '', pie: '' })
  return [...cabecera, ...bloques]
}

// El camino inverso: quita titular y portada y deja solo el contenido.
export function sinCabeceraDeCorreo(bloques: Bloque[]) {
  return bloques.filter(b => b.id !== ID_TITULAR && b.id !== ID_PORTADA)
}

export function contarImagenes(bloques: Bloque[]) {
  return bloques.filter(b => b.tipo === 'imagen').length
}

// Version en texto plano, para la columna content y como texto alternativo del correo.
export function textoPlano(bloques: Bloque[]) {
  return bloques
    .filter((b): b is BloqueTexto => b.tipo === 'texto')
    .map(b => [b.subtitulo.trim(), ...parrafos(b.texto)].filter(Boolean).join('\n\n'))
    .filter(Boolean)
    .join('\n\n')
}

export function tieneTexto(bloques: Bloque[]) {
  return bloques.some(b => b.tipo === 'texto' && (b.subtitulo.trim() || parrafos(b.texto).length))
}

function texto(valor: unknown, max: number, campo: string): string {
  if (valor === undefined || valor === null) return ''
  if (typeof valor !== 'string') throw new Error(`El campo ${campo} no es texto`)
  if (valor.length > max) throw new Error(`El campo ${campo} pasa de ${max} caracteres`)
  return valor
}

// Valida y limpia lo que llega del navegador. Lanza Error con un mensaje claro.
// maxImagenes permite descontar la portada en la version web.
export function normalizarBloques(entrada: unknown, modo: Modo, maxImagenes = MAX_IMAGENES): Bloque[] {
  if (!Array.isArray(entrada)) throw new Error('Los bloques no tienen el formato correcto')
  if (entrada.length > MAX_BLOQUES) throw new Error(`Máximo ${MAX_BLOQUES} bloques`)

  const vistos = new Set<string>()
  const bloques = entrada.map((b, i): Bloque => {
    if (!b || typeof b !== 'object') throw new Error(`El bloque ${i + 1} no es válido`)
    const o = b as Record<string, unknown>
    const id = typeof o.id === 'string' && /^[A-Za-z0-9-]{1,64}$/.test(o.id) && !vistos.has(o.id) ? o.id : nuevoId()
    vistos.add(id)
    const etiqueta = texto(o.etiqueta, LIMITES.etiqueta, 'etiqueta') || undefined

    if (o.tipo === 'imagen') {
      const url = texto(o.url, 2000, 'url').trim()
      if (url && !urlImagenPermitida(url)) {
        throw new Error(`La imagen del bloque ${i + 1} no viene del almacenamiento de la newsletter`)
      }
      return {
        id, tipo: 'imagen', url, etiqueta,
        alt: texto(o.alt, LIMITES.alt, 'texto alternativo').trim(),
        pie: texto(o.pie, LIMITES.pie, 'pie de foto').trim(),
      }
    }
    if (o.tipo === 'texto') {
      const enlace = modo === 'correo' && typeof o.enlaceId === 'string' && o.enlaceId ? o.enlaceId : null
      if (enlace && !/^[A-Za-z0-9-]{1,64}$/.test(enlace)) throw new Error(`El enlace del bloque ${i + 1} no es válido`)
      return {
        id, tipo: 'texto', etiqueta,
        subtitulo: texto(o.subtitulo, LIMITES.subtitulo, 'subtítulo').trim(),
        texto: texto(o.texto, LIMITES.texto, 'texto'),
        enlaceId: enlace,
      }
    }
    throw new Error(`El bloque ${i + 1} tiene un tipo desconocido`)
  })

  if (contarImagenes(bloques) > maxImagenes) throw new Error(`Máximo ${maxImagenes} imágenes`)
  return bloques
}
