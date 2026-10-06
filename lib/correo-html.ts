import { bloquesVisibles, parrafos, urlImagenPermitida, type Bloque } from '@/lib/bloques'
import { NOMBRE_SITIO, SITE_URL, urlNoticia } from '@/lib/sitio'

// UNICA funcion que construye el correo. La usan la vista previa, el envio de
// prueba y el envio a suscriptores, siempre con lo guardado en la base de datos.
// Estilo diario, tablas y estilos en linea, Georgia (Gmail no carga Google Fonts).

export const LIMITE_AVISO_BYTES = 90 * 1024

export type DatosCorreo = {
  asunto: string
  bloques: Bloque[]
  // ids de articulos web publicados: un boton solo se dibuja si su articulo esta aqui.
  publicados: Set<string>
  // Enlace "Darme de baja" de ESTE destinatario (en la vista previa y la prueba, uno que no da de baja a nadie).
  enlaceBaja: string
  fecha: Date
}

export type CorreoConstruido = {
  html: string
  texto: string
  bytes: number
  // errores: impiden enviar. avisos: se muestran pero no bloquean.
  errores: string[]
  avisos: string[]
}

const TINTA = '#1a1a1a'
const GRIS = '#5c5c5c'
const CREMA = '#fbf8f1'
const FONDO = '#efebe2'
const FUENTE = "Georgia, 'Times New Roman', Times, serif"

export function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fila(contenido: string, padding = '0 28px') {
  return `<tr><td style="padding:${padding};">${contenido}</td></tr>`
}

function boton(href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px 0;">
<tr><td bgcolor="${TINTA}" style="background-color:${TINTA};">
<a href="${escapar(href)}" target="_blank" style="display:inline-block;padding:13px 22px;font-family:${FUENTE};font-size:15px;font-weight:bold;line-height:1.2;color:${CREMA};text-decoration:none;">Leer la noticia completa &rarr;</a>
</td></tr></table>`
}

export function construirCorreo({ asunto, bloques, publicados, fecha, enlaceBaja }: DatosCorreo): CorreoConstruido {
  const errores: string[] = []
  const avisos: string[] = []
  const visibles = bloquesVisibles(bloques)
  const descartadas = bloques.filter(b => b.tipo === 'imagen' && b.url && !urlImagenPermitida(b.url)).length
  if (descartadas) avisos.push(`Se omitieron ${descartadas} imágenes que no vienen del almacenamiento de la newsletter.`)

  const fechaTexto = fecha.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Havana',
  })
  const primerParrafo = visibles.flatMap(b => (b.tipo === 'texto' ? parrafos(b.texto) : []))[0] ?? ''

  const filas: string[] = []
  const texto: string[] = [asunto, '']
  let textosPrevios = 0

  for (const b of visibles) {
    if (b.tipo === 'imagen') {
      const alt = b.alt || b.pie || asunto || NOMBRE_SITIO
      filas.push(
        `<tr><td style="padding:8px 0 ${b.pie ? '0' : '16px'} 0;"><img src="${escapar(b.url)}" width="600" alt="${escapar(alt)}" style="width:100%;max-width:600px;height:auto;display:block;border:0;outline:none;text-decoration:none;" /></td></tr>`
      )
      if (b.pie) {
        filas.push(fila(`<p style="margin:8px 0 18px 0;font-family:${FUENTE};font-size:13px;line-height:1.5;font-style:italic;color:${GRIS};">${escapar(b.pie)}</p>`))
      }
      continue
    }

    const partes: string[] = []
    if (b.subtitulo) {
      if (textosPrevios > 0) {
        partes.push(`<div style="border-top:1px solid #d6d1c4;height:1px;line-height:1px;font-size:1px;margin:6px 0 20px 0;">&nbsp;</div>`)
      }
      partes.push(`<h2 style="margin:0 0 12px 0;font-family:${FUENTE};font-size:23px;line-height:1.25;font-weight:bold;color:${TINTA};">${escapar(b.subtitulo)}</h2>`)
      texto.push(b.subtitulo.toUpperCase())
    }
    for (const p of parrafos(b.texto)) {
      partes.push(`<p style="margin:0 0 16px 0;font-family:${FUENTE};font-size:17px;line-height:1.6;color:${TINTA};">${escapar(p)}</p>`)
      texto.push(p)
    }
    if (b.enlaceId) {
      if (publicados.has(b.enlaceId)) {
        partes.push(boton(urlNoticia(b.enlaceId)))
        texto.push(`Leer la noticia completa: ${urlNoticia(b.enlaceId)}`)
      } else {
        errores.push('Un botón «Leer la noticia completa» apunta a un artículo que ya no está publicado. Elige otro o quítalo antes de enviar.')
      }
    }
    texto.push('')
    filas.push(fila(partes.join('\n'), '8px 28px 8px 28px'))
    textosPrevios++
  }

  if (!asunto.trim()) errores.push('Falta el asunto del correo.')
  if (textosPrevios === 0) errores.push('El correo no tiene ningún texto.')

  const urlNoticias = `${SITE_URL}/noticias`

  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapar(asunto)}</title>
</head>
<body style="margin:0;padding:0;background-color:${FONDO};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapar(primerParrafo.slice(0, 140))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${FONDO};">
<tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${CREMA};">
<tr><td style="padding:28px 28px 0 28px;text-align:center;">
<p style="margin:0 0 10px 0;font-family:${FUENTE};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GRIS};">${escapar(fechaTexto)}</p>
<a href="${escapar(SITE_URL)}" target="_blank" style="font-family:${FUENTE};font-size:36px;line-height:1.1;font-weight:bold;color:${TINTA};text-decoration:none;">${escapar(NOMBRE_SITIO)}</a>
<div style="border-top:3px solid ${TINTA};border-bottom:1px solid ${TINTA};height:2px;line-height:2px;font-size:2px;margin:16px 0 8px 0;">&nbsp;</div>
<p style="margin:0 0 20px 0;font-family:${FUENTE};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GRIS};">Lo que pasa en Cuba y el mundo</p>
</td></tr>
${filas.join('\n')}
<tr><td style="padding:12px 28px 28px 28px;">
<div style="border-top:3px double ${TINTA};height:1px;line-height:1px;font-size:1px;margin:8px 0 18px 0;">&nbsp;</div>
<p style="margin:0;font-family:${FUENTE};font-size:15px;font-weight:bold;color:${TINTA};text-align:center;">${escapar(NOMBRE_SITIO)}</p>
<p style="margin:6px 0 0 0;font-family:${FUENTE};font-size:13px;line-height:1.5;color:${GRIS};text-align:center;">Lee todas las noticias en <a href="${escapar(urlNoticias)}" target="_blank" style="color:${TINTA};">${escapar(urlNoticias.replace(/^https:\/\//, ''))}</a></p>
<p style="margin:10px 0 0 0;font-family:${FUENTE};font-size:12px;line-height:1.5;color:${GRIS};text-align:center;">Recibes este correo porque te suscribiste en ${escapar(SITE_URL.replace(/^https:\/\//, ''))}.</p>
<p style="margin:10px 0 0 0;font-family:${FUENTE};font-size:12px;line-height:1.5;color:${GRIS};text-align:center;">¿No quieres recibir más correos? <a href="${escapar(enlaceBaja)}" target="_blank" style="color:${GRIS};text-decoration:underline;">Darme de baja</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  texto.push('—', NOMBRE_SITIO, `Lee todas las noticias en ${urlNoticias}`)
  texto.push(`¿No quieres recibir más correos? Date de baja aquí: ${enlaceBaja}`)

  const bytes = new TextEncoder().encode(html).length
  if (bytes > LIMITE_AVISO_BYTES) {
    avisos.push(`El correo pesa ${Math.round(bytes / 1024)} KB. Gmail recorta los correos de más de ~102 KB: acorta el texto o quita bloques.`)
  }

  return { html, texto: texto.join('\n'), bytes, errores: [...new Set(errores)], avisos }
}
