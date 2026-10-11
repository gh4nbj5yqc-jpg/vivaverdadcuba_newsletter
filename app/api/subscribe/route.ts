import { after, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
import { emailValido, enviarBienvenida, ultimaEdicionEnviada } from '@/lib/correo-envio'

// El correo de bienvenida se envia despues de responder al navegador.
export const maxDuration = 30

function respuesta(ultimoCorreo: boolean) {
  return NextResponse.json({ success: true, ultimoCorreo })
}

export async function POST(request: Request) {
  let email = ''
  try {
    const cuerpo = await request.json()
    if (typeof cuerpo?.email === 'string') email = cuerpo.email.trim().toLowerCase()
  } catch {
    // cuerpo vacio o mal formado: se trata como correo no valido
  }
  // Un correo mal escrito rebota al enviar, y los rebotes mandan los demas correos a spam.
  if (!emailValido(email)) return NextResponse.json({ error: 'Escribe un correo válido' }, { status: 400 })

  // Si ya estaba suscrito no se repite la fila ni se le vuelve a enviar nada.
  // ("*" es un comodin que ilike no deja escapar: en ese caso se compara exacto.)
  const patron = email.replace(/[\\%_]/g, c => '\\' + c)
  const busqueda = supabase.from('subscribers').select('id').limit(1)
  const { data: existentes, error: errorBusqueda } = await (email.includes('*')
    ? busqueda.eq('email', email)
    : busqueda.ilike('email', patron))
  if (errorBusqueda) return NextResponse.json({ error: errorBusqueda.message }, { status: 500 })
  if (existentes.length > 0) return respuesta(false)

  const { data: nuevo, error } = await supabase.from('subscribers').insert([{ email }]).select('id').single()
  if (error) {
    // 23505 = correo repetido (dos envios del formulario a la vez): ya esta suscrito.
    if (error.code === '23505') return respuesta(false)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Bienvenida: el ultimo correo enviado. Si falla, la suscripcion sigue siendo valida.
  let idEdicion: string | null = null
  try {
    idEdicion = await ultimaEdicionEnviada()
  } catch (e) {
    console.error('Bienvenida: no se pudo buscar el último correo', e)
  }
  if (idEdicion) {
    const edicion = idEdicion
    const destinatario = { id: String(nuevo.id), email }
    after(async () => {
      try {
        await enviarBienvenida(edicion, destinatario)
      } catch (e) {
        console.error('Bienvenida: no se pudo enviar el último correo', e)
      }
    })
  }

  return respuesta(Boolean(idEdicion))
}
