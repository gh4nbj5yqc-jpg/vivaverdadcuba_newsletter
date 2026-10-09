// Lo que el navegador recuerda del chat mientras la persona sigue en la web:
// su codigo al azar, su color y cuales mensajes son suyos.
// Se guarda en la pestaña (sessionStorage): sirve al cambiar de noticia, volver atras o recargar,
// y se borra solo al cerrar la pestaña. Nunca sale del navegador salvo el codigo, al enviar un mensaje.

const CLAVE = 'vvc-chat'

export type SesionChat = { codigo: string; color: string | null; mios: string[] }

export function leerSesion(): SesionChat | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return null
    const s = JSON.parse(crudo) as Partial<SesionChat> | null
    if (!s || typeof s.codigo !== 'string') return null
    return {
      codigo: s.codigo,
      color: typeof s.color === 'string' ? s.color : null,
      mios: Array.isArray(s.mios) ? s.mios.filter(x => typeof x === 'string').slice(-200) : [],
    }
  } catch {
    // Navegacion privada estricta o almacenamiento bloqueado: el chat funciona igual, sin recordar.
    return null
  }
}

export function guardarSesion(s: SesionChat) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(s))
  } catch {
    // Sin almacenamiento no pasa nada: solo no se recuerda el color al cambiar de pagina.
  }
}
