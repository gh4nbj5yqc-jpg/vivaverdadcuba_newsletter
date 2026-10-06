import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Lectura publica de ediciones para /noticias. Solo se usa en el servidor:
// trae unicamente columnas publicas y solo ediciones ya enviadas.
export type EdicionPublica = {
  id: string
  title: string
  content: string
  image_url: string | null
  published_at: string
}

const COLUMNAS = 'id, title, content, image_url, published_at'

export async function listarEdiciones(): Promise<EdicionPublica[]> {
  const { data, error } = await supabaseAdmin
    .from('editions')
    .select(COLUMNAS)
    .eq('sent', true)
    .order('published_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// cache() evita consultar dos veces la misma edicion (pagina + metadata).
export const obtenerEdicion = cache(async (id: string): Promise<EdicionPublica | null> => {
  const { data, error } = await supabaseAdmin
    .from('editions')
    .select(COLUMNAS)
    .eq('sent', true)
    .eq('id', id)
    .maybeSingle()

  // Un id con formato invalido hace fallar la consulta: lo tratamos como "no existe".
  if (error) return null
  return data
})

export function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Havana',
  })
}

export function parrafos(texto: string) {
  return texto.split('\n').map(p => p.trim()).filter(p => p !== '')
}

export function adelanto(texto: string, max = 180) {
  const plano = parrafos(texto).join(' ')
  if (plano.length <= max) return plano
  const corte = plano.slice(0, max)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return (ultimoEspacio > 0 ? corte.slice(0, ultimoEspacio) : corte).replace(/[\s.,;:]+$/, '') + '…'
}
