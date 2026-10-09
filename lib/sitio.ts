// Direccion publica del sitio. Es el UNICO lugar donde se escribe: la usan el
// correo, los botones "Leer la noticia completa →" y los metadatos.
export const SITE_URL = 'https://www.vivaverdadcuba.com'

export const NOMBRE_SITIO = 'Viva Verdad Cuba'

// Redes sociales. Las que todavia no existen llevan null: salen opacas y sin enlace.
// Cuando abras una cuenta, cambia null por la direccion del perfil (entre comillas)
// y ese logo se activa solo, a todo color.
export type Red = 'instagram' | 'facebook' | 'x' | 'threads' | 'tiktok'

export const REDES: Record<Red, string | null> = {
  instagram: 'https://www.instagram.com/viva_verdad_cuba/',
  facebook: null,
  x: null,
  threads: null,
  tiktok: null,
}

export function urlNoticia(id: string) {
  return `${SITE_URL}/noticias/${encodeURIComponent(id)}`
}

// Remitente de los correos (dominio verificado en Resend).
export const REMITENTE = 'Viva Verdad Cuba <noticias@vivaverdadcuba.com>'
