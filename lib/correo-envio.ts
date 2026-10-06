import { createHash } from 'crypto'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { construirCorreo, type CorreoConstruido } from '@/lib/correo-html'
import { ErrorNoticia, esAntigua, idsPublicados, obtenerNoticia, type NoticiaAdmin } from '@/lib/noticias-admin'
import { cabecerasBaja, ID_PRUEBA, urlPaginaBaja } from '@/lib/baja'
import { REMITENTE } from '@/lib/sitio'

// Solo servidor. El correo SIEMPRE se construye desde lo guardado en la base de datos.

const resend = new Resend(process.env.RESEND_API_KEY)
const POR_LOTE = 100
const EMAIL_VALIDO = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]+$/

export function emailValido(email: string) {
  return email.length <= 254 && EMAIL_VALIDO.test(email)
}

type CorreoCargado = {
  noticia: NoticiaAdmin
  // Version para la vista previa y la prueba: su enlace de baja no da de baja a nadie.
  correo: CorreoConstruido
  // Version para un suscriptor concreto, con SU enlace de baja firmado.
  construirPara: (idSuscriptor: string) => CorreoConstruido
}

export async function cargarCorreo(id: string): Promise<CorreoCargado> {
  const noticia = await obtenerNoticia(id)
  if (esAntigua(noticia) || !noticia.blocks) {
    throw new ErrorNoticia('Esta noticia no tiene versión de correo guardada. Escríbela en la pestaña Correo y guárdala.')
  }
  const enlaces = noticia.blocks.flatMap(b => (b.tipo === 'texto' && b.enlaceId ? [b.enlaceId] : []))
  const publicados = await idsPublicados([...new Set(enlaces)])
  const bloques = noticia.blocks
  // Un correo ya enviado se muestra con su fecha de envio. Misma fecha para todos los destinatarios.
  const fecha = noticia.sent_at ? new Date(noticia.sent_at) : new Date()
  const construirPara = (idSuscriptor: string) =>
    construirCorreo({ asunto: noticia.title ?? '', bloques, publicados, fecha, enlaceBaja: urlPaginaBaja(idSuscriptor) })

  return { noticia, correo: construirPara(ID_PRUEBA), construirPara }
}

type Destinatario = { id: string; email: string }

// Todos los suscriptores (paginando de 1000 en 1000), sin repetidos y con formato valido.
// Orden estable para que los lotes sean los mismos si se reintenta.
export async function listarDestinatarios(): Promise<Destinatario[]> {
  const vistos = new Set<string>()
  const lista: Destinatario[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, created_at')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(desde, desde + 999)
    if (error) throw new ErrorNoticia('No se pudo leer la lista de suscriptores: ' + error.message, 500)
    for (const s of data) {
      const email = String(s.email ?? '').trim()
      const clave = email.toLowerCase()
      if (emailValido(email) && !vistos.has(clave)) {
        vistos.add(clave)
        lista.push({ id: String(s.id), email })
      }
    }
    if (data.length < 1000) return lista
  }
}

export async function enviarPrueba(id: string, destino: string) {
  if (!emailValido(destino)) throw new ErrorNoticia('Escribe un correo válido para la prueba')
  const { noticia, correo } = await cargarCorreo(id)
  if (correo.errores.length) throw new ErrorNoticia(correo.errores.join(' '))

  const { data, error } = await resend.emails.send({
    from: REMITENTE,
    to: destino,
    subject: `[PRUEBA] ${noticia.title}`,
    html: correo.html,
    text: correo.texto,
    // Cabeceras de baja de prueba: se ven en el correo pero no dan de baja a nadie.
    headers: cabecerasBaja(ID_PRUEBA),
  })
  if (error || !data?.id) throw new ErrorNoticia('Resend no aceptó el correo de prueba: ' + (error?.message ?? 'sin respuesta'), 502)
  return { resendId: data.id }
}

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))

export type ResultadoEnvio =
  | { ok: true; enviados: number; lotes: number; marcada: boolean }
  | { ok: false; error: string; enviados: number; loteFallido: number; lotes: number }

export async function enviarASuscriptores(id: string, confirmados: number): Promise<ResultadoEnvio> {
  const { noticia, correo, construirPara } = await cargarCorreo(id)
  if (noticia.sent) throw new ErrorNoticia('Este correo ya se envió a los suscriptores.', 409)
  if (correo.errores.length) throw new ErrorNoticia(correo.errores.join(' '))

  const destinatarios = await listarDestinatarios()
  if (destinatarios.length === 0) throw new ErrorNoticia('No hay suscriptores a quien enviar.')
  if (destinatarios.length !== confirmados) {
    throw new ErrorNoticia(
      `El número de suscriptores cambió (ahora son ${destinatarios.length}). Vuelve a pulsar «Enviar a suscriptores» para confirmar.`,
      409
    )
  }

  const lotes: Destinatario[][] = []
  for (let i = 0; i < destinatarios.length; i += POR_LOTE) lotes.push(destinatarios.slice(i, i + POR_LOTE))

  // La clave de idempotencia depende de la noticia, el lote, sus destinatarios y el contenido:
  // si se reintenta el mismo envio, Resend no repite los lotes que ya salieron (durante 24 h).
  const huellaContenido = createHash('sha256').update(`${noticia.title}\n${correo.html}`).digest('hex').slice(0, 16)

  let enviados = 0
  for (let n = 0; n < lotes.length; n++) {
    const lote = lotes[n]
    const huellaLote = createHash('sha256').update(lote.map(d => `${d.id} ${d.email}`).join('\n')).digest('hex').slice(0, 16)
    const idempotencyKey = `edicion-${id}-lote-${n + 1}-${huellaLote}-${huellaContenido}`

    // Un correo por destinatario, cada uno con su enlace de baja y sus cabeceras de baja en un clic.
    const correos = lote.map(d => {
      const suyo = construirPara(d.id)
      return {
        from: REMITENTE,
        to: d.email,
        subject: noticia.title ?? '',
        html: suyo.html,
        text: suyo.texto,
        headers: cabecerasBaja(d.id),
      }
    })

    let error: { message: string; statusCode: number | null } | null = null
    for (let intento = 0; intento < 3; intento++) {
      const res = await resend.batch.send(correos, { idempotencyKey })
      error = res.error ?? (res.data?.data?.length === lote.length ? null : { message: 'Resend no confirmó todos los correos del lote', statusCode: null })
      // Reintenta solo si Resend pidió esperar (429) o tuvo un fallo propio (5xx).
      const reintentable = error && (error.statusCode === 429 || (error.statusCode ?? 0) >= 500)
      if (!reintentable) break
      await esperar(1500 * (intento + 1))
    }

    if (error) {
      const desde = n * POR_LOTE + 1
      const hasta = n * POR_LOTE + lote.length
      return {
        ok: false,
        enviados,
        loteFallido: n + 1,
        lotes: lotes.length,
        error:
          `Falló el lote ${n + 1} de ${lotes.length} (destinatarios ${desde}–${hasta}): ${error.message}. ` +
          (enviados
            ? `Los lotes anteriores (${enviados} correos) sí se enviaron. `
            : 'No se envió ningún correo. ') +
          'La noticia NO se marcó como enviada. Si reintentas en las próximas 24 h sin cambiar el correo ni la lista, los lotes que ya salieron no se repetirán.',
      }
    }

    enviados += lote.length
    if (n < lotes.length - 1) await esperar(600) // respeta el limite de peticiones por segundo de Resend
  }

  // Solo se marca como enviada cuando Resend confirmo TODOS los lotes.
  const { error: errorMarca } = await supabaseAdmin
    .from('editions')
    .update({ sent: true, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('sent', false)

  return { ok: true, enviados, lotes: lotes.length, marcada: !errorMarca }
}
