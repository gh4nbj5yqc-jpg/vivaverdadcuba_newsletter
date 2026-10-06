import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { bloquesVisibles, parrafos, urlImagenPermitida, type Bloque, type BloqueImagen } from '@/lib/bloques'

export { bloquesVisibles }

// Lectura publica de articulos para /noticias. Solo se usa en el servidor:
// trae unicamente las columnas web y solo articulos publicados (no borradores),
// sin importar si el correo se envio. Las ediciones antiguas no tienen web_blocks.
export type ArticuloPublico = {
  id: string
  web_title: string
  web_cover_url: string | null
  web_blocks: Bloque[]
  web_published_at: string
}

const COLUMNAS = 'id, web_title, web_cover_url, web_blocks, web_published_at'

export async function listarArticulos(): Promise<ArticuloPublico[]> {
  const { data, error } = await supabaseAdmin
    .from('editions')
    .select(COLUMNAS)
    .eq('web_status', 'publicada')
    .not('web_blocks', 'is', null)
    .order('web_published_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as ArticuloPublico[]
}

// cache() evita consultar dos veces el mismo articulo (pagina + metadata).
export const obtenerArticulo = cache(async (id: string): Promise<ArticuloPublico | null> => {
  const { data, error } = await supabaseAdmin
    .from('editions')
    .select(COLUMNAS)
    .eq('web_status', 'publicada')
    .not('web_blocks', 'is', null)
    .eq('id', id)
    .maybeSingle()

  // Un id con formato invalido hace fallar la consulta: lo tratamos como "no existe".
  if (error) return null
  return data as ArticuloPublico | null
})

export function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Havana',
  })
}

export function portadaDe(a: ArticuloPublico): string | null {
  if (a.web_cover_url && urlImagenPermitida(a.web_cover_url)) return a.web_cover_url
  const primera = bloquesVisibles(a.web_blocks).find((b): b is BloqueImagen => b.tipo === 'imagen')
  return primera?.url ?? null
}

export function altImagen(b: BloqueImagen, titular: string) {
  return b.alt || b.pie || `Imagen de la noticia: ${titular}`
}

export function adelanto(a: ArticuloPublico, max = 180) {
  const plano = a.web_blocks
    .flatMap(b => (b.tipo === 'texto' ? parrafos(b.texto) : []))
    .join(' ')
  if (plano.length <= max) return plano
  const corte = plano.slice(0, max)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > 0 ? corte.slice(0, ultimoEspacio) : corte).replace(/[\s.,;:]+$/, '') + '…'
}
