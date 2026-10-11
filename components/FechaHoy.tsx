'use client'

import { useSyncExternalStore } from 'react'

// La fecha de hoy ("10 de octubre"), corta para que quepa en un renglon en el telefono. Se calcula en el navegador: si se calculara
// en el servidor quedaria congelada en las paginas que se generan una sola vez.
const sinSuscripcion = () => () => {}

function hoy() {
  return new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

export default function FechaHoy({ className = '' }: { className?: string }) {
  const fecha = useSyncExternalStore(sinSuscripcion, hoy, () => '')
  // Mientras carga se reserva el renglon, para que la pagina no salte.
  return <span className={className}>{fecha || ' '}</span>
}
