'use client'

import { useCallback, useEffect, useState } from 'react'
import { pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import { avisoError, ayuda, botonConfirmar, botonDiscreto } from './estilos'

type Suscriptor = { id: string; email: string; created_at: string }

export default function Suscriptores() {
  const [lista, setLista] = useState<Suscriptor[] | null>(null)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const d = await pedirJson<{ suscriptores: Suscriptor[] }>('/api/subscribers')
      setLista(d.suscriptores)
    } catch (e) {
      if (!(e instanceof SesionExpirada)) setError(e instanceof Error ? e.message : 'Error al cargar')
    }
  }, [])

  useEffect(() => {
    let vigente = true
    pedirJson<{ suscriptores: Suscriptor[] }>('/api/subscribers')
      .then(d => { if (vigente) setLista(d.suscriptores) })
      .catch(e => { if (vigente && !(e instanceof SesionExpirada)) setError(e.message) })
    return () => { vigente = false }
  }, [])

  async function eliminar(id: string) {
    setConfirmando(null)
    try {
      await pedirJson('/api/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await cargar()
    } catch (e) {
      if (!(e instanceof SesionExpirada)) setError(e instanceof Error ? e.message : 'No se pudo eliminar')
    }
  }

  if (error) return <p role="alert" className={avisoError}>{error}</p>
  if (!lista) return <p className={`${ayuda} py-8`}>Cargando…</p>

  return (
    <section>
      <p className="mb-3 text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">
        {lista.length} {lista.length === 1 ? 'suscriptor' : 'suscriptores'}
      </p>
      <ul className="tarjeta divide-y divide-linea overflow-hidden">
        {lista.map(s => (
          <li key={s.id} className="px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[1.0625rem] font-semibold">{s.email}</p>
                <p className="text-[0.9375rem] text-tinta-2">
                  {new Date(s.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button type="button" onClick={() => setConfirmando(s.id)} className="min-h-11 shrink-0 rounded-full px-2 text-[0.9375rem] font-semibold text-acento-tinta">
                Eliminar
              </button>
            </div>
            {confirmando === s.id && (
              <div role="alertdialog" aria-label="Confirmar eliminación" className={`${avisoError} mt-2 mb-1 flex flex-wrap items-center gap-2`}>
                <p className="mr-auto break-all">¿Eliminar a {s.email}?</p>
                <button type="button" className={botonConfirmar} onClick={() => eliminar(s.id)}>Sí, eliminar</button>
                <button type="button" className={botonDiscreto} onClick={() => setConfirmando(null)}>Cancelar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
