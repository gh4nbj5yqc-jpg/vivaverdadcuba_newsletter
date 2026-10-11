'use client'

import { useState } from 'react'

type Props = { s: string; t: string; prueba: boolean }

// La baja solo ocurre al pulsar este boton (POST), nunca por abrir el enlace.
export default function BotonBaja({ s, t, prueba }: Props) {
  const [estado, setEstado] = useState<'inicio' | 'enviando' | 'hecho' | 'error'>('inicio')
  const [error, setError] = useState('')

  async function confirmar() {
    setEstado('enviando')
    setError('')
    try {
      const params = new URLSearchParams({ s })
      if (t) params.set('t', t)
      const res = await fetch(`/api/baja?${params}`, { method: 'POST' })
      const datos = await res.json().catch(() => ({}))
      if (res.ok && datos.ok) {
        setEstado('hecho')
      } else {
        setError(datos.error || 'No pudimos completar la baja. Inténtalo de nuevo.')
        setEstado('error')
      }
    } catch {
      setError('No hay conexión. Inténtalo de nuevo.')
      setEstado('error')
    }
  }

  if (estado === 'hecho') {
    return (
      <p role="status" className="mt-7 rounded-2xl bg-[#34c759]/20 px-4 py-3.5 text-left leading-snug">
        {prueba ? (
          <><strong>Esto es una prueba.</strong> Así se verá el mensaje, pero no se ha dado de baja a nadie.</>
        ) : (
          <><strong>Listo, te has dado de baja.</strong> Ya no recibirás más correos de Viva Verdad Cuba.</>
        )}
      </p>
    )
  }

  return (
    <div className="mt-7">
      <button
        type="button"
        onClick={confirmar}
        disabled={estado === 'enviando'}
        className="boton-acento w-full sm:w-auto"
      >
        {estado === 'enviando' ? 'Procesando…' : 'Confirmar baja'}
      </button>
      {estado === 'error' && (
        <p role="alert" className="mt-4 rounded-2xl bg-acento/15 px-4 py-3 text-left leading-snug">
          {error}
        </p>
      )}
    </div>
  )
}
