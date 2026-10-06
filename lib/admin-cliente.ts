'use client'

// fetch para las rutas del admin: si la sesion caduco (401), avisa al panel
// con un evento para que vuelva a la pantalla de contraseña.
export const EVENTO_SESION_EXPIRADA = 'admin-sesion-expirada'

export class SesionExpirada extends Error {
  constructor() {
    super('Tu sesión expiró. Vuelve a entrar.')
  }
}

export async function pedirAdmin(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  if (res.status === 401) {
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
    throw new SesionExpirada()
  }
  return res
}

// Atajo para JSON: lanza Error con el mensaje del servidor si algo falla.
export async function pedirJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await pedirAdmin(url, init)
  } catch (e) {
    if (e instanceof SesionExpirada) throw e
    throw new Error('No hay conexión. Inténtalo de nuevo.')
  }
  const datos = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(datos.error || 'Algo salió mal. Inténtalo de nuevo.')
  return datos as T
}
