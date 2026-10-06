import { NextResponse } from 'next/server'
import { esAdmin, noAutorizado } from '@/lib/admin-auth'
import { supabaseAdmin, BUCKET_IMAGENES } from '@/lib/supabase-admin'

// Devuelve una URL firmada de un solo uso para que el panel suba la imagen
// directamente a Supabase Storage sin necesitar permisos de escritura publicos.
export async function POST(request: Request) {
  if (!(await esAdmin())) return noAutorizado()

  const { nombre } = await request.json()
  const limpio = String(nombre || 'imagen').replace(/[^a-zA-Z0-9._-]/g, '_')
  const ruta = `${Date.now()}-${limpio}`

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_IMAGENES)
    .createSignedUploadUrl(ruta)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_IMAGENES)
    .getPublicUrl(ruta)

  return NextResponse.json({ ruta, token: data.token, publicUrl: urlData.publicUrl })
}
