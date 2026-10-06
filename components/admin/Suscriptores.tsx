'use client'

import { useCallback, useEffect, useState } from 'react'
import { pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import { avisoError, botonPeligro } from './estilos'

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
  if (!lista) return <p className="py-8 text-[#1a1a1a]/60">Cargando…</p>

  return (
    <section>
      <p className="mb-4 text-[#1a1a1a]/70">
        <strong className="text-[#1a1a1a]">{lista.length}</strong> {lista.length === 1 ? 'suscriptor' : 'suscriptores'}
      </p>
      <ul className="divide-y divide-[#1a1a1a]/20 border-y border-[#1a1a1a]/20">
        {lista.map(s => (
          <li key={s.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.email}</p>
                <p className="text-sm text-[#1a1a1a]/60">
                  {new Date(s.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button type="button" onClick={() => setConfirmando(s.id)} className="min-h-11 shrink-0 px-2 text-sm font-semibold text-[#8b1a1a] underline">
                Eliminar
              </button>
            </div>
            {confirmando === s.id && (
              <div role="alertdialog" aria-label="Confirmar eliminación" className="mt-2 flex flex-wrap items-center gap-2 bg-[#8b1a1a]/10 px-3 py-2">
                <p className="mr-auto text-sm text-[#6b1414]">¿Eliminar a {s.email}?</p>
                <button type="button" className={botonPeligro} onClick={() => eliminar(s.id)}>Sí, eliminar</button>
                <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setConfirmando(null)}>Cancelar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
