// Secciones de /noticias. No importa nada del servidor: se usa tambien en el navegador.
// "general" son las noticias de siempre (web y correo, tabla editions).
// Las locales van en su propia tabla (noticias_locales) y NUNCA se envian por correo.

export type SeccionLocal = 'louisville'
export type Seccion = 'general' | SeccionLocal | 'miami' | 'houston'

// Orden de las pestañas. activa = false: sale la pestaña, pero solo con "Próximamente".
export const SECCIONES: { id: Seccion; nombre: string; activa: boolean }[] = [
  { id: 'general', nombre: 'General', activa: true },
  { id: 'louisville', nombre: 'Louisville', activa: true },
  { id: 'miami', nombre: 'Miami', activa: false },
  { id: 'houston', nombre: 'Houston', activa: false },
]

export const SECCIONES_LOCALES: SeccionLocal[] = ['louisville']

export function esSeccionLocal(valor: unknown): valor is SeccionLocal {
  return SECCIONES_LOCALES.includes(valor as SeccionLocal)
}

// Lo que llega en ?seccion=... Cualquier otra cosa es "general".
export function seccionDeParam(valor: unknown): Seccion {
  return SECCIONES.find(s => s.id === valor)?.id ?? 'general'
}

export function nombreSeccion(seccion: Seccion) {
  return SECCIONES.find(s => s.id === seccion)?.nombre ?? 'General'
}

// Direccion de cada pestaña. General es /noticias a secas, como siempre.
// No se usa /noticias/louisville porque /noticias/[id] ya es la pagina de cada noticia.
export function urlSeccion(seccion: Seccion) {
  return seccion === 'general' ? '/noticias' : `/noticias?seccion=${seccion}`
}

// En el panel: que editor abre una noticia, el general (web y correo) o el local (solo web).
export type TipoNoticia = 'general' | 'local'
