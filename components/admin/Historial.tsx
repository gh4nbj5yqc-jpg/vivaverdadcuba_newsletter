'use client'

import { useEffect, useState } from 'react'
import { pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import type { NoticiaAdmin } from '@/lib/noticias-admin'
import { avisoError, avisoOk, ayuda, botonPrimario, botonPeligro, botonSecundario, verde } from './estilos'

type Props = {
  onAbrir: (id: string) => void
  onEliminada: (id: string) => void
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function Estado({ texto, tono }: { texto: string; tono: 'ok' | 'neutro' | 'apagado' }) {
  const color = tono === 'ok' ? `bg-[#34c759]/16 ${verde}` : tono === 'neutro' ? 'bg-relleno text-tinta' : 'bg-relleno text-tinta-3'
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold ${color}`}>{texto}</span>
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
  if (!noticias) return <p className={`${ayuda} py-8`}>Cargando…</p>

  return (
    <section>
      {aviso && (
        <p role={aviso.tipo === 'ok' ? 'status' : 'alert'} className={`${aviso.tipo === 'ok' ? avisoOk : avisoError} mb-4`}>
          {aviso.texto}
        </p>
      )}

      {noticias.length === 0 ? (
        <p className={`${ayuda} py-8`}>Todavía no hay noticias.</p>
      ) : (
        <ul className="space-y-3">
          {noticias.map(n => {
            const id = String(n.id)
            const antigua = n.blocks === null && n.web_blocks === null
            const publicada = !antigua && n.web_blocks !== null && n.web_status === 'publicada'
            const cuando = n.sent_at || n.web_published_at || n.updated_at || n.published_at
            return (
              <li key={id} className="tarjeta px-4 py-4 sm:px-5">
                <p className="text-[0.9375rem] font-semibold text-tinta-2">{fecha(cuando)}</p>
                <h3 className="mt-1 text-[1.25rem] font-bold leading-snug tracking-[-0.02em]">{nombreDe(n)}</h3>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9375rem] text-tinta-2">
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

                <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {!antigua && (
                    <button type="button" onClick={() => onAbrir(id)} className={botonSecundario}>
                      Editar
                    </button>
                  )}
                  <button type="button" onClick={() => { setConfirmando(id); setAviso(null) }}
                    disabled={eliminando !== null}
                    className={`${antigua ? 'col-span-2' : ''} ${botonPeligro} min-h-12! sm:col-span-1`}>
                    Eliminar
                  </button>
                </div>

                {confirmando === id && (
                  <div role="alertdialog" aria-labelledby={`borrar-${id}`} className={`${avisoError} mt-4`}>
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
                        className={botonPrimario}>
                        {eliminando === id ? 'Eliminando…' : 'Sí, eliminar'}
                      </button>
                      <button type="button" onClick={() => setConfirmando(null)} disabled={eliminando !== null}
                        className={botonSecundario}>
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
