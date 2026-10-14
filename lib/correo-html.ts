import { bloquesVisibles, ID_TITULAR, parrafos, urlImagenPermitida, type Bloque } from '@/lib/bloques'
import { NOMBRE_SITIO, SITE_URL, urlNoticia } from '@/lib/sitio'

// UNICA funcion que construye el correo. La usan la vista previa, el envio de
// prueba y el envio a suscriptores, siempre con lo guardado en la base de datos.
// Mismo estilo que la web (tipo Apple News): tarjetas de esquinas amplias, imagenes
// redondeadas y los mismos colores. Tablas y estilos en linea para que Gmail lo respete.

export const LIMITE_AVISO_BYTES = 90 * 1024

export type DatosCorreo = {
  asunto: string
  bloques: Bloque[]
  // ids de articulos web publicados: un boton solo se dibuja si su articulo esta aqui.
  publicados: Set<string>
  // Enlace "Darme de baja" de ESTE destinatario (en la vista previa y la prueba, uno que no da de baja a nadie).
  enlaceBaja: string
  fecha: Date
  // Pagina web de esta misma noticia (null si aun no esta publicada en la web).
  // Si la hay, el correo termina con el boton «Leer la noticia completa».
  enlaceNoticia: string | null
  // true solo en el correo de bienvenida: añade una nota corta arriba para quien se acaba de suscribir.
  bienvenida?: boolean
}

export type CorreoConstruido = {
  html: string
  texto: string
  bytes: number
  // errores: impiden enviar. avisos: se muestran pero no bloquean.
  errores: string[]
  avisos: string[]
}

// Mismos colores que la web (app/globals.css), ya mezclados sobre blanco o gris:
// muchos clientes de correo no entienden las transparencias.
const TINTA = '#000000'
const GRIS = '#6e6e73' // --tinta-2
const GRIS_SUAVE = '#8e8e93' // --tinta-3
const LINEA = '#e3e3e8' // --linea
const RELLENO = '#efeff4' // --relleno
const FONDO = '#f2f2f7' // --fondo
const SUPERFICIE = '#ffffff' // --superficie
const ACENTO = '#e0193a'
const ACENTO_TINTA = '#d1102f'
// Atardecer del Malecon (components/FondoPortada.tsx). bgcolor es el color de reserva en Outlook.
const ATARDECER = '#8b3f96'
const DEGRADADO = 'linear-gradient(160deg,#2a2f8a 0%,#8b3f96 42%,#ef5f72 74%,#ff9f58 92%,#ffd08a 100%)'
// Letra del sistema (San Francisco en iPhone y Mac) y serifa de lectura, como en la web.
// Gmail no carga fuentes web: donde no existan, sale Helvetica/Arial y Georgia.
const SANS = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif"
const SERIF = "ui-serif,'New York','Iowan Old Style',Charter,Georgia,'Times New Roman',serif"
const ANCHO = 600
const MARGEN = 24 // padding lateral dentro de la tarjeta
const ANCHO_IMAGEN = ANCHO - 2 * MARGEN

export function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fila(contenido: string, padding = `0 ${MARGEN}px`) {
  return `<tr><td class="lado" style="padding:${padding};">${contenido}</td></tr>`
}

// Boton en forma de capsula roja, como .boton-acento de la web.
function boton(href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 12px 0;">
<tr><td align="center" bgcolor="${ACENTO}" style="background-color:${ACENTO};border-radius:999px;">
<a href="${escapar(href)}" target="_blank" style="display:inline-block;padding:14px 24px;font-family:${SANS};font-size:16px;font-weight:600;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:999px;">Leer la noticia completa &rarr;</a>
</td></tr></table>`
}

const NOTA_BIENVENIDA = `Gracias por suscribirte a ${NOMBRE_SITIO}. Este es el último correo que enviamos; los próximos te llegarán a esta misma dirección.`

export function construirCorreo({ asunto, bloques, publicados, fecha, enlaceBaja, enlaceNoticia, bienvenida = false }: DatosCorreo): CorreoConstruido {
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
  const texto: string[] = bienvenida ? [NOTA_BIENVENIDA, '', asunto, ''] : [asunto, '']
  if (bienvenida) {
    // Nota de bienvenida en una capsula gris, como los avisos de la web.
    filas.push(
      fila(
        `<p style="margin:0;padding:14px 18px;background-color:${RELLENO};border-radius:18px;font-family:${SANS};font-size:15px;line-height:1.45;color:${GRIS};text-align:center;">${escapar(NOTA_BIENVENIDA)}</p>`,
        `0 ${MARGEN}px 20px ${MARGEN}px`
      )
    )
  }
  let textosPrevios = 0

  for (const b of visibles) {
    if (b.tipo === 'imagen') {
      const alt = b.alt || b.pie || asunto || NOMBRE_SITIO
      // Imagen con esquinas redondeadas dentro de la tarjeta, como en la web (rounded-2xl).
      const pie = b.pie
        ? `<p style="margin:8px 0 0 0;padding:0 4px;font-family:${SANS};font-size:14px;line-height:1.4;color:${GRIS};">${escapar(b.pie)}</p>`
        : ''
      filas.push(
        fila(
          `<img src="${escapar(b.url)}" width="${ANCHO_IMAGEN}" alt="${escapar(alt)}" style="width:100%;max-width:${ANCHO_IMAGEN}px;height:auto;display:block;border:0;outline:none;text-decoration:none;border-radius:18px;" />${pie}`,
          `10px ${MARGEN}px 22px ${MARGEN}px`
        )
      )
      continue
    }

    // El titular de la noticia abre el correo, en grande. No cuenta como texto del correo.
    if (b.id === ID_TITULAR) {
      filas.push(
        fila(
          `<h1 class="titular" style="margin:0;font-family:${SANS};font-size:31px;line-height:1.1;font-weight:800;letter-spacing:-0.6px;color:${TINTA};">${escapar(b.subtitulo)}</h1>`,
          `0 ${MARGEN}px 14px ${MARGEN}px`
        )
      )
      continue
    }

    const partes: string[] = []
    if (b.subtitulo) {
      if (textosPrevios > 0) {
        partes.push(`<div style="border-top:1px solid ${LINEA};height:1px;line-height:1px;font-size:1px;margin:8px 0 24px 0;">&nbsp;</div>`)
      }
      partes.push(`<h2 style="margin:0 0 12px 0;font-family:${SANS};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-0.4px;color:${TINTA};">${escapar(b.subtitulo)}</h2>`)
      texto.push(b.subtitulo.toUpperCase())
    }
    // El texto de lectura va con serifa, como los articulos de la web.
    for (const p of parrafos(b.texto)) {
      partes.push(`<p style="margin:0 0 18px 0;font-family:${SERIF};font-size:18px;line-height:1.6;color:${TINTA};">${escapar(p)}</p>`)
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
    filas.push(fila(partes.join('\n'), `6px ${MARGEN}px 6px ${MARGEN}px`))
    textosPrevios++
  }

  if (enlaceNoticia) {
    filas.push(fila(boton(enlaceNoticia), `4px ${MARGEN}px 6px ${MARGEN}px`))
    texto.push(`Leer la noticia completa: ${enlaceNoticia}`, '')
  } else {
    avisos.push('El botón «Leer la noticia completa» no sale porque la noticia todavía no está publicada en la web. Con «Publicar en ambos» se publica primero y el botón sí sale en el correo.')
  }

  if (!asunto.trim()) errores.push('Falta el titular (es también el asunto del correo).')
  if (textosPrevios === 0) errores.push('La noticia no tiene ningún texto.')

  const urlNoticias = `${SITE_URL}/noticias`

  // Estructura: fondo gris; arriba una tarjeta con el atardecer del Malecon y una capsula
  // de "cristal" (blanco translucido con borde claro: el correo no permite desenfoque real);
  // debajo la tarjeta blanca de la noticia, de esquinas amplias; y el pie en gris, fuera de la tarjeta.
  // Todo va en linea; el <style> solo afina el movil donde el cliente lo respete.
  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapar(asunto)}</title>
<style>
@media only screen and (max-width:480px) {
  .exterior { padding:10px 8px 24px 8px !important; }
  .lado { padding-left:18px !important; padding-right:18px !important; }
  .nombre { font-size:30px !important; }
  .titular { font-size:27px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${FONDO};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapar((bienvenida ? NOTA_BIENVENIDA : primerParrafo).slice(0, 140))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FONDO}" style="background-color:${FONDO};">
<tr><td align="center" class="exterior" style="padding:20px 12px 32px 12px;">
<table role="presentation" width="${ANCHO}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${ANCHO}px;">

<tr><td bgcolor="${ATARDECER}" class="lado" style="padding:30px ${MARGEN}px 26px ${MARGEN}px;background-color:${ATARDECER};background-image:${DEGRADADO};border-radius:28px;">
<a href="${escapar(SITE_URL)}" target="_blank" class="nombre" style="font-family:${SANS};font-size:36px;line-height:1.05;font-weight:800;letter-spacing:-1px;color:#ffffff;text-decoration:none;">${escapar(NOMBRE_SITIO)}</a>
<p style="margin:6px 0 18px 0;font-family:${SANS};font-size:16px;line-height:1.3;font-weight:600;color:#ffe3d6;">${escapar(fechaTexto)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding:9px 16px;background-color:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.5);border-radius:999px;font-family:${SANS};font-size:14px;line-height:1.2;font-weight:600;color:#ffffff;">Lo que pasa en Cuba y el mundo</td>
</tr></table>
</td></tr>

<tr><td style="height:16px;line-height:16px;font-size:16px;">&nbsp;</td></tr>

<tr><td bgcolor="${SUPERFICIE}" style="background-color:${SUPERFICIE};border-radius:28px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="height:${MARGEN}px;line-height:${MARGEN}px;font-size:${MARGEN}px;">&nbsp;</td></tr>
${filas.join('\n')}
<tr><td style="height:14px;line-height:14px;font-size:14px;">&nbsp;</td></tr>
</table>
</td></tr>

<tr><td class="lado" style="padding:26px ${MARGEN}px 0 ${MARGEN}px;text-align:center;">
<p style="margin:0;font-family:${SANS};font-size:15px;font-weight:700;color:${TINTA};text-align:center;">${escapar(NOMBRE_SITIO)}</p>
<p style="margin:6px 0 0 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${GRIS};text-align:center;">Lee todas las noticias en <a href="${escapar(urlNoticias)}" target="_blank" style="color:${ACENTO_TINTA};font-weight:600;text-decoration:none;">${escapar(urlNoticias.replace(/^https:\/\//, ''))}</a></p>
<p style="margin:12px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${GRIS_SUAVE};text-align:center;">Recibes este correo porque te suscribiste en ${escapar(SITE_URL.replace(/^https:\/\//, ''))}.</p>
<p style="margin:6px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${GRIS_SUAVE};text-align:center;">¿No quieres recibir más correos? <a href="${escapar(enlaceBaja)}" target="_blank" style="color:${GRIS};text-decoration:underline;">Darme de baja</a></p>
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
