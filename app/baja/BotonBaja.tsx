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
      <p role="status" className="mt-8 border-l-4 border-[#2f6b3a] bg-[#2f6b3a]/10 px-4 py-4 text-left text-[#1f4a27]">
        {prueba ? (
          <><strong>Esto es una prueba.</strong> Así se verá el mensaje, pero no se ha dado de baja a nadie.</>
        ) : (
          <><strong>Listo, te has dado de baja.</strong> Ya no recibirás más correos de Viva Verdad Cuba.</>
        )}
      </p>
    )
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={confirmar}
        disabled={estado === 'enviando'}
        className="min-h-12 w-full bg-[#1a1a1a] px-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#fbf8f1] transition hover:bg-[#8b1a1a] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {estado === 'enviando' ? 'Procesando…' : 'Confirmar baja'}
      </button>
      {estado === 'error' && (
        <p role="alert" className="mt-4 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-3 text-left text-[#6b1414]">
          {error}
        </p>
      )}
    </div>
  )
}
