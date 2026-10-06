// Direccion publica del sitio. Es el UNICO lugar donde se escribe: la usan el
// correo, los botones "Leer la noticia completa →" y los metadatos.
export const SITE_URL = 'https://www.vivaverdadcuba.com'

export const NOMBRE_SITIO = 'Viva Verdad Cuba'

export function urlNoticia(id: string) {
  return `${SITE_URL}/noticias/${encodeURIComponent(id)}`
}

// Remitente de los correos (dominio verificado en Resend).
export const REMITENTE = 'Viva Verdad Cuba <noticias@vivaverdadcuba.com>'
