'use client'

import { useEffect, useState } from 'react'
import { pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import type { MensajeChat } from '@/lib/chat'
import Bolita from '@/components/chat/Bolita'
import { avisoError, botonPeligro } from './estilos'

// Pestaña "Chat" del panel: ver los mensajes del chat publico y borrar el que haga falta.
// El chat no se modera; esto es solo para poder quitar algo si un dia es necesario
// (por ejemplo, publicidad o datos privados de otra persona).

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

export default function ChatAdmin() {
  const [mensajes, setMensajes] = useState<MensajeChat[] | null>(null)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)

  useEffect(() => {
    pedirJson<{ mensajes: MensajeChat[] }>('/api/chat')
      .then(d => setMensajes([...d.mensajes].reverse()))
      .catch(e => { if (!(e instanceof SesionExpirada)) setError(e.message) })
  }, [])

  async function borrar(id: string) {
    setBorrando(id)
    setError('')
    try {
      await pedirJson(`/api/chat/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setMensajes(prev => prev?.filter(m => m.id !== id) ?? null)
      setConfirmando(null)
    } catch (e) {
      if (!(e instanceof SesionExpirada)) setError(e instanceof Error ? e.message : 'No se pudo borrar el mensaje.')
    } finally {
      setBorrando(null)
    }
  }

  if (!mensajes) return error ? <p role="alert" className={avisoError}>{error}</p> : <p className="py-8 text-[#1a1a1a]/60">Cargando…</p>

  return (
    <section>
      <p className="mb-4 text-sm text-[#1a1a1a]/70">
        Mensajes del chat público, del más nuevo al más viejo. Se borran solos a los 3 días.
      </p>
      {error && <p role="alert" className={`${avisoError} mb-4`}>{error}</p>}

      {mensajes.length === 0 ? (
        <p className="py-8 text-[#1a1a1a]/60">No hay mensajes en el chat.</p>
      ) : (
        <ul className="divide-y divide-[#1a1a1a]/20 border-y border-[#1a1a1a]/20">
          {mensajes.map(m => (
            <li key={m.id} className="py-4">
              <div className="flex items-start gap-3">
                <Bolita color={m.color} className="mt-1.5" />
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                  <p className="mt-1 text-xs text-[#1a1a1a]/50">{fecha(m.created_at)}</p>
                </div>
                {confirmando !== m.id && (
                  <button type="button" className={botonPeligro} disabled={borrando !== null} onClick={() => setConfirmando(m.id)}>
                    Borrar
                  </button>
                )}
              </div>
              {confirmando === m.id && (
                <div role="alertdialog" aria-label="Confirmar borrado" className="mt-3 flex flex-wrap items-center gap-2 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-3">
                  <p className="mr-auto text-[#6b1414]">¿Borrar este mensaje para siempre?</p>
                  <button type="button" className={botonPeligro} disabled={borrando !== null} onClick={() => borrar(m.id)}>
                    {borrando === m.id ? 'Borrando…' : 'Sí, borrar'}
                  </button>
                  <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setConfirmando(null)}>Cancelar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
