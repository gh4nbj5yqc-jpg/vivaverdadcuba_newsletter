'use client'

import { useEffect, useState } from 'react'
import { pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import type { NoticiaAdmin } from '@/lib/noticias-admin'
import { avisoError, avisoOk, titular } from './estilos'

type Props = {
  onAbrir: (id: string) => void
  onEliminada: (id: string) => void
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function Estado({ texto, tono }: { texto: string; tono: 'ok' | 'neutro' | 'apagado' }) {
  const color = tono === 'ok' ? 'border-[#2f6b3a] text-[#1f4a27] bg-[#2f6b3a]/10' : tono === 'neutro' ? 'border-[#1a1a1a]/50 text-[#1a1a1a]' : 'border-[#1a1a1a]/20 text-[#1a1a1a]/50'
  return <span className={`inline-block border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] ${color}`}>{texto}</span>
}

const nombreDe = (n: NoticiaAdmin) => n.web_title || n.title || '(sin título)'

export default function Historial({ onAbrir, onEliminada }: Props) {
  const [noticias, setNoticias] = useState<NoticiaAdmin[] | null>(null)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    pedirJson<{ ediciones: NoticiaAdmin[] }>('/api/editions')
      .then(d => setNoticias(d.ediciones))
      .catch(e => { if (!(e instanceof SesionExpirada)) setError(e.message) })
  }, [])

  async function eliminar(n: NoticiaAdmin) {
    const id = String(n.id)
    setEliminando(id)
    setAviso(null)
    try {
      await pedirJson(`/api/editions/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setNoticias(prev => prev?.filter(x => String(x.id) !== id) ?? null)
      setConfirmando(null)
      setAviso({ tipo: 'ok', texto: `Se eliminó la noticia «${nombreDe(n)}».` })
      onEliminada(id)
    } catch (e) {
      if (!(e instanceof SesionExpirada)) {
        setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo eliminar la noticia.' })
      }
    } finally {
      setEliminando(null)
    }
  }

  if (error) return <p role="alert" className={avisoError}>{error}</p>
  if (!noticias) return <p className="py-8 text-[#1a1a1a]/60">Cargando…</p>

  return (
    <section>
      {aviso && (
        <p role={aviso.tipo === 'ok' ? 'status' : 'alert'} className={`${aviso.tipo === 'ok' ? avisoOk : avisoError} mb-4`}>
          {aviso.texto}
        </p>
      )}

      {noticias.length === 0 ? (
        <p className="py-8 text-[#1a1a1a]/60">Todavía no hay noticias.</p>
      ) : (
        <ul className="divide-y divide-[#1a1a1a]/20 border-y border-[#1a1a1a]/20">
          {noticias.map(n => {
            const id = String(n.id)
            const antigua = n.blocks === null && n.web_blocks === null
            const publicada = !antigua && n.web_blocks !== null && n.web_status === 'publicada'
            const cuando = n.sent_at || n.web_published_at || n.updated_at || n.published_at
            return (
              <li key={id} className="py-5">
                <p className="text-xs uppercase tracking-[0.15em] text-[#1a1a1a]/60">{fecha(cuando)}</p>
                <h3 className={`${titular} mt-1 text-xl font-bold leading-snug`}>{nombreDe(n)}</h3>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="flex items-center gap-2">
                    Correo:
                    {antigua ? (
                      <Estado texto={n.sent ? 'Enviado (formato antiguo)' : 'Formato antiguo'} tono="apagado" />
                    ) : n.sent ? (
                      <Estado texto="Enviado" tono="ok" />
                    ) : (
                      <Estado texto="No enviado" tono="neutro" />
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    Web:
                    {antigua ? (
                      <Estado texto="Sin versión web" tono="apagado" />
                    ) : publicada ? (
                      <Estado texto="Publicada" tono="ok" />
                    ) : (
                      <Estado texto="Borrador" tono="neutro" />
                    )}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {!antigua && (
                    <button type="button" onClick={() => onAbrir(id)}
                      className="min-h-12 border border-[#1a1a1a] px-4 text-sm font-semibold hover:bg-[#1a1a1a] hover:text-[#fbf8f1]">
                      Editar
                    </button>
                  )}
                  <button type="button" onClick={() => { setConfirmando(id); setAviso(null) }}
                    disabled={eliminando !== null}
                    className={`${antigua ? 'col-span-2' : ''} min-h-12 border border-[#8b1a1a] bg-white px-4 text-sm font-semibold text-[#8b1a1a] transition hover:bg-[#8b1a1a] hover:text-white disabled:opacity-50 sm:col-span-1`}>
                    Eliminar
                  </button>
                </div>

                {confirmando === id && (
                  <div role="alertdialog" aria-labelledby={`borrar-${id}`} className="mt-4 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-4 text-[#6b1414]">
                    <p id={`borrar-${id}`} className="font-semibold">¿Eliminar «{nombreDe(n)}»?</p>
                    <p className="mt-2">Esto borra la noticia para siempre.</p>
                    {publicada && (
                      <p className="mt-2">
                        Está publicada en la web: dejará de verse en /noticias, y los enlaces que apunten a ella llevarán a una
                        página de «noticia no encontrada».
                      </p>
                    )}
                    {n.sent && (
                      <p className="mt-2">
                        Su correo ya fue enviado: se borrará del historial, pero los correos que ya llegaron a los suscriptores no se
                        pueden recuperar.
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                      <button type="button" onClick={() => eliminar(n)} disabled={eliminando !== null}
                        className="min-h-12 bg-[#8b1a1a] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#6b1414] disabled:opacity-60">
                        {eliminando === id ? 'Eliminando…' : 'Sí, eliminar'}
                      </button>
                      <button type="button" onClick={() => setConfirmando(null)} disabled={eliminando !== null}
                        className="min-h-12 border border-[#1a1a1a]/40 bg-white px-5 text-sm font-semibold text-[#1a1a1a] hover:border-[#1a1a1a] disabled:opacity-60">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
