'use client'

import { useEffect, useRef, useState } from 'react'
import type { EstadoWeb } from '@/lib/noticias-admin'
import { nombreSeccion, urlSeccion, type SeccionLocal } from '@/lib/secciones'
import type { ResultadoGuardar } from './EditorNoticia'
import { avisoError, avisoOk, ayuda, botonPrimario, botonSecundario } from './estilos'

// Parte final del editor de una noticia local: ver como queda en la web y publicarla.
// Las noticias locales solo van a la web: aqui no hay correo, prueba ni envio.

type Props = {
  seccion: SeccionLocal
  publicada: boolean
  ocupado: boolean
  guardar: (estado: EstadoWeb) => Promise<ResultadoGuardar>
}

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null

// Ancho de la pagina dentro del marco. En "Ordenador" la web usa su diseño grande (desde 640 px);
// el marco se encoge para caber en el panel, pero la pagina se dibuja a ese ancho.
const ANCHOS = { movil: 375, ordenador: 760 } as const
const ALTO = 720

export default function RevisarLocal({ seccion, publicada, ocupado, guardar }: Props) {
  const [accion, setAccion] = useState<'vista' | 'web' | null>(null)
  const [vista, setVista] = useState<string | null>(null)
  const [ancho, setAncho] = useState<keyof typeof ANCHOS>('movil')
  const [aviso, setAviso] = useState<Aviso>(null)

  const caja = useRef<HTMLDivElement>(null)
  const [disponible, setDisponible] = useState(0)
  useEffect(() => {
    const el = caja.current
    if (!el) return
    const medir = () => setDisponible(el.clientWidth)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [vista])

  const trabajando = accion !== null || ocupado
  const escala = disponible ? Math.min(1, disponible / ANCHOS[ancho]) : 1

  // La vista previa guarda primero, sin cambiar si esta o no en la web, y muestra lo guardado.
  async function verPrevia() {
    setAviso(null)
    setAccion('vista')
    try {
      const r = await guardar(publicada ? 'publicada' : 'borrador')
      if (r.ok) setVista(`/admin/vista-local/${encodeURIComponent(r.id)}?v=${Date.now()}`)
      else if (r.error) setAviso({ tipo: 'error', texto: r.error })
    } finally {
      setAccion(null)
    }
  }

  async function publicarEnWeb() {
    setAviso(null)
    setAccion('web')
    try {
      const r = await guardar('publicada')
      if (r.ok) {
        setAviso({ tipo: 'ok', texto: `¡Publicada en la web! Ya se puede leer en la pestaña ${nombreSeccion(seccion)} de /noticias.` })
        if (vista) setVista(`/admin/vista-local/${encodeURIComponent(r.id)}?v=${Date.now()}`)
      } else if (r.error) {
        setAviso({ tipo: 'error', texto: r.error })
      }
    } finally {
      setAccion(null)
    }
  }

  return (
    <div className="tarjeta mt-7 p-4 sm:p-5">
      <h2 className="text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">Revisar y publicar</h2>
      <p className={`${ayuda} mt-1`}>
        Las noticias de {nombreSeccion(seccion)} solo se publican en la web; nunca se envían por correo. Cada botón guarda
        primero la noticia.
        {publicada ? ' Como ya está publicada, lo guardado se ve en la web al momento.' : ''}
      </p>

      <div className="mt-4 grid gap-2 sm:flex">
        <button type="button" className={botonSecundario} disabled={trabajando} onClick={verPrevia}>
          {accion === 'vista' ? 'Preparando…' : 'Vista previa'}
        </button>
        <button type="button" className={botonPrimario} disabled={trabajando || publicada} onClick={publicarEnWeb}>
          {publicada ? '✓ Ya está en la web' : accion === 'web' ? 'Publicando…' : 'Publicar en la web'}
        </button>
      </div>
      {publicada && (
        <p className={`${ayuda} mt-2`}>
          <a href={urlSeccion(seccion)} target="_blank" rel="noopener" className="font-semibold text-acento-tinta">
            Ver la pestaña {nombreSeccion(seccion)} en la web ↗
          </a>
        </p>
      )}

      {aviso && (
        <p role={aviso.tipo === 'ok' ? 'status' : 'alert'} className={`${aviso.tipo === 'ok' ? avisoOk : avisoError} mt-4`}>
          {aviso.texto}
        </p>
      )}

      {vista && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={ayuda}>Así se verá en la web{publicada ? '' : ' cuando la publiques'}.</p>
            <div className="flex rounded-full bg-relleno p-1" role="group" aria-label="Ancho de la vista previa">
              {(['movil', 'ordenador'] as const).map(a => (
                <button key={a} type="button" onClick={() => setAncho(a)} aria-pressed={ancho === a}
                  className={`min-h-9 rounded-full px-3.5 text-[0.9375rem] font-semibold transition ${ancho === a ? 'bg-superficie text-tinta shadow-[0_1px_3px_rgba(0,0,0,0.14)]' : 'text-tinta-2'}`}>
                  {a === 'movil' ? 'Móvil' : 'Ordenador'}
                </button>
              ))}
            </div>
          </div>
          <div ref={caja} className="mt-3 overflow-hidden rounded-2xl bg-fondo shadow-[inset_0_0_0_1px_var(--linea)]">
            <div className="mx-auto" style={{ width: ANCHOS[ancho] * escala, height: ALTO * escala }}>
              <iframe
                title="Vista previa en la web"
                src={vista}
                className="block border-0 bg-fondo"
                style={{ width: ANCHOS[ancho], height: ALTO, transform: `scale(${escala})`, transformOrigin: 'top left' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
