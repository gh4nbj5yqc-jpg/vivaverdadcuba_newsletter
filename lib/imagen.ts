'use client'

import { createClient } from '@supabase/supabase-js'
import { pedirAdmin } from '@/lib/admin-cliente'

// Solo navegador: prepara la imagen (max 1600 px, JPEG, fondo blanco) y la sube
// con la URL firmada de /api/upload-url, igual que antes.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MAX_BYTES = 15 * 1024 * 1024
const ANCHO_MAX = 1600
const CALIDAD = 0.82

function esImagen(archivo: File) {
  return archivo.type.startsWith('image/') || /\.(heic|heif)$/i.test(archivo.name)
}

function cargar(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('no se pudo leer')) }
    img.src = url
  })
}

export async function prepararImagen(archivo: File): Promise<Blob> {
  if (!esImagen(archivo)) throw new Error('Ese archivo no es una imagen. Elige una foto JPG, PNG o HEIC.')
  if (archivo.size > MAX_BYTES) throw new Error('La imagen pesa más de 15 MB. Elige una más pequeña.')

  let img: HTMLImageElement
  try {
    img = await cargar(archivo)
  } catch {
    const heic = /heic|heif/i.test(archivo.type) || /\.(heic|heif)$/i.test(archivo.name)
    throw new Error(
      heic
        ? 'Este navegador no puede abrir fotos HEIC. Súbela desde el iPhone (Safari) o conviértela a JPG.'
        : 'No se pudo abrir la imagen. Prueba con otra foto JPG o PNG.'
    )
  }

  const escala = Math.min(1, ANCHO_MAX / img.naturalWidth)
  const ancho = Math.round(img.naturalWidth * escala)
  const alto = Math.round(img.naturalHeight * escala)

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador.')
  ctx.fillStyle = '#ffffff' // fondo blanco para imagenes con transparencia
  ctx.fillRect(0, 0, ancho, alto)
  ctx.drawImage(img, 0, 0, ancho, alto)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', CALIDAD))
  if (!blob) throw new Error('No se pudo convertir la imagen a JPEG.')
  return blob
}

// Devuelve la URL publica de la imagen ya subida.
export async function subirImagen(archivo: File): Promise<string> {
  const jpeg = await prepararImagen(archivo)
  const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg'

  const res = await pedirAdmin('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre }),
  })
  const firmada = await res.json()
  if (!res.ok || !firmada.token) throw new Error(firmada.error || 'No se pudo preparar la subida.')

  const { error } = await supabase.storage
    .from('newsletter-images')
    .uploadToSignedUrl(firmada.ruta, firmada.token, jpeg, { contentType: 'image/jpeg' })
  if (error) throw new Error('Error subiendo la imagen: ' + error.message)

  return firmada.publicUrl
}
