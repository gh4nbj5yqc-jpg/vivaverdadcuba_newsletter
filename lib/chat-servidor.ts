import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  colorPara,
  DIAS_CHAT,
  errorDeTexto,
  limpiarTexto,
  llegoAlTopeSeguidos,
  MAX_EN_PANTALLA,
  MAX_POR_MINUTO,
  MAX_SEGUIDOS,
  type MensajeChat,
  type MensajeReciente,
} from '@/lib/chat'

// Solo servidor: lectura y guardado de los mensajes del chat.
// El chat es anonimo: no se guarda nombre, correo ni direccion de internet de nadie.

const TABLA = 'chat_mensajes'
const FORMATO_CODIGO = /^[A-Za-z0-9-]{16,100}$/
const FORMATO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class ErrorChat extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

// Fecha limite: lo anterior a esto ya no se muestra y se borra.
const limite = () => new Date(Date.now() - DIAS_CHAT * 24 * 60 * 60 * 1000).toISOString()

// Los mensajes de los ultimos 3 dias, del mas viejo al mas nuevo.
export async function listarMensajes(): Promise<MensajeChat[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLA)
    .select('id, texto, color, created_at')
    .gt('created_at', limite())
    .order('created_at', { ascending: false })
    .limit(MAX_EN_PANTALLA)
  if (error) throw new ErrorChat('El chat no está disponible ahora mismo.', 500)
  return (data as MensajeChat[]).reverse()
}

export async function publicarMensaje(cuerpo: unknown): Promise<MensajeChat> {
  const c = (cuerpo && typeof cuerpo === 'object' ? cuerpo : {}) as Record<string, unknown>

  if (typeof c.texto !== 'string') throw new ErrorChat('Escribe un mensaje.')
  const texto = limpiarTexto(c.texto)
  const problema = errorDeTexto(texto)
  if (problema) throw new ErrorChat(problema)

  // El navegador inventa un codigo al azar cada vez que alguien entra al chat. Aqui solo se guarda
  // una huella de ese codigo, para saber que mensajes son de la misma visita. No identifica a nadie.
  if (typeof c.codigo !== 'string' || !FORMATO_CODIGO.test(c.codigo)) {
    throw new ErrorChat('Recarga la página e inténtalo de nuevo.')
  }
  const autor = createHash('sha256').update(c.codigo).digest('hex').slice(0, 32)

  const { data, error } = await supabaseAdmin
    .from(TABLA)
    .select('autor, color, created_at')
    .gt('created_at', limite())
    .order('created_at', { ascending: false })
    .limit(MAX_EN_PANTALLA)
  if (error) throw new ErrorChat('El chat no está disponible ahora mismo.', 500)
  const recientes = data as MensajeReciente[]

  if (llegoAlTopeSeguidos(recientes, autor)) {
    throw new ErrorChat(`Ya escribiste ${MAX_SEGUIDOS} mensajes seguidos. Cuando alguien más escriba podrás seguir.`, 409)
  }
  const haceUnMinuto = Date.now() - 60_000
  if (recientes.filter(m => Date.parse(m.created_at) > haceUnMinuto).length >= MAX_POR_MINUTO) {
    throw new ErrorChat('El chat va muy rápido. Espera unos segundos y vuelve a intentarlo.', 429)
  }

  const color = colorPara(recientes, autor, c.color)
  const { data: creado, error: errorAlta } = await supabaseAdmin
    .from(TABLA)
    .insert([{ texto, color, autor }])
    .select('id, texto, color, created_at')
    .single()
  if (errorAlta) throw new ErrorChat('No se pudo guardar el mensaje. Inténtalo de nuevo.', 500)

  // Limpieza: borra lo que ya paso de 3 dias. Si falla no importa, porque de todos modos no se muestra.
  await supabaseAdmin.from(TABLA).delete().lt('created_at', limite())

  return creado as MensajeChat
}

// Para el panel de admin: borra un mensaje concreto.
export async function borrarMensaje(id: string) {
  if (!FORMATO_ID.test(id)) throw new ErrorChat('El identificador del mensaje no es válido')
  const { data, error } = await supabaseAdmin.from(TABLA).delete().eq('id', id).select('id')
  if (error) throw new ErrorChat('No se pudo borrar el mensaje.', 500)
  if (!data || data.length === 0) throw new ErrorChat('El mensaje no existe o ya fue borrado', 404)
}
