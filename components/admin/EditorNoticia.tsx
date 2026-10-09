'use client'

import { useEffect, useState } from 'react'
import { estructuraInicial, MAX_IMAGENES, sinCabeceraDeCorreo, type Bloque } from '@/lib/bloques'
import { pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import type { EstadoWeb, NoticiaAdmin } from '@/lib/noticias-admin'
import EditorBloques from './EditorBloques'
import CampoImagen from './CampoImagen'
import RevisarYPublicar from './RevisarYPublicar'
import { avisoError, avisoOk, botonPeligro, botonPrimario, botonSecundario, campo, etiqueta, titular } from './estilos'

// Editor unico: la noticia se escribe UNA sola vez y sirve para la web y para el correo.

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null

// Lo que devuelve guardar(). error = null significa que la sesion expiro
// (el panel ya muestra la pantalla de contraseña, no hace falta otro aviso).
export type ResultadoGuardar = { ok: true; id: string } | { ok: false; error: string | null }

type Props = {
  idInicial: string | null
  onCambiosPendientes: (hay: boolean) => void
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

// Compara el contenido de dos listas de bloques (sin fijarse en los ids).
const huella = (b: Bloque) => (b.tipo === 'imagen' ? ['imagen', b.url, b.alt, b.pie] : ['texto', b.subtitulo, b.texto])
const mismoContenido = (a: Bloque[], b: Bloque[]) => JSON.stringify(a.map(huella)) === JSON.stringify(b.map(huella))

export default function EditorNoticia({ idInicial, onCambiosPendientes }: Props) {
  const [id, setId] = useState<string | null>(idInicial)
  const [cargando, setCargando] = useState(Boolean(idInicial))
  const [errorCarga, setErrorCarga] = useState('')
  const [antigua, setAntigua] = useState(false)

  // La noticia
  const [titulo, setTitulo] = useState('')
  const [portada, setPortada] = useState('')
  const [bloques, setBloques] = useState<Bloque[]>(estructuraInicial)

  // Donde esta publicada
  const [estadoWeb, setEstadoWeb] = useState<EstadoWeb>('borrador')
  const [publicadaEl, setPublicadaEl] = useState<string | null>(null)
  const [enviado, setEnviado] = useState<{ sent: boolean; sentAt: string | null }>({ sent: false, sentAt: null })
  // Noticias hechas con el editor anterior, que tenian un correo escrito aparte.
  const [correoAparte, setCorreoAparte] = useState(false)

  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)
  const [confirmarRetiro, setConfirmarRetiro] = useState(false)

  const foto = JSON.stringify({ titulo, portada, bloques })
  const [guardado, setGuardado] = useState<string | null>(null)
  const pendiente = guardado !== null && guardado !== foto

  // Foto inicial de una noticia nueva: no hay cambios hasta que se escribe algo.
  if (guardado === null && !idInicial) setGuardado(foto)

  useEffect(() => {
    onCambiosPendientes(pendiente)
  }, [pendiente, onCambiosPendientes])

  useEffect(() => {
    if (!pendiente) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [pendiente])

  function aplicar(n: NoticiaAdmin) {
    // Lo normal es leer la version web. Una noticia antigua que solo tenia correo se lee del correo.
    const tieneWeb = n.web_blocks !== null
    const t = (tieneWeb ? n.web_title : n.title) ?? ''
    const p = tieneWeb ? n.web_cover_url ?? '' : ''
    const b = n.web_blocks ?? (n.blocks ? sinCabeceraDeCorreo(n.blocks) : estructuraInicial())

    setId(String(n.id))
    setAntigua(n.blocks === null && n.web_blocks === null)
    setTitulo(t)
    setPortada(p)
    setBloques(b)
    setEstadoWeb(n.web_status)
    setPublicadaEl(n.web_published_at)
    setEnviado({ sent: Boolean(n.sent), sentAt: n.sent_at })
    setCorreoAparte(
      !n.sent &&
        n.blocks !== null &&
        (n.blocks.some(x => x.tipo === 'texto' && x.enlaceId) ||
          (n.web_blocks !== null && !mismoContenido(sinCabeceraDeCorreo(n.blocks), n.web_blocks)))
    )
    setGuardado(JSON.stringify({ titulo: t, portada: p, bloques: b }))
  }

  useEffect(() => {
    if (!idInicial) return
    let vigente = true
    ;(async () => {
      try {
        const { edicion } = await pedirJson<{ edicion: NoticiaAdmin }>(`/api/editions/${encodeURIComponent(idInicial)}`)
        if (vigente) aplicar(edicion)
      } catch (e) {
        if (vigente && !(e instanceof SesionExpirada)) {
          setErrorCarga(e instanceof Error ? e.message : 'No se pudo cargar la noticia.')
        }
      } finally {
        if (vigente) setCargando(false)
      }
    })()
    return () => { vigente = false }
  }, [idInicial])

  // Guarda la noticia con el estado web indicado. No muestra avisos: eso lo decide quien la llama.
  async function guardar(estado: EstadoWeb): Promise<ResultadoGuardar> {
    setGuardando(true)
    try {
      const { edicion } = await pedirJson<{ edicion: NoticiaAdmin }>(
        id ? `/api/editions/${encodeURIComponent(id)}` : '/api/editions',
        {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, portada, bloques, estado }),
        }
      )
      aplicar(edicion)
      return { ok: true, id: String(edicion.id) }
    } catch (e) {
      if (e instanceof SesionExpirada) return { ok: false, error: null }
      return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar.' }
    } finally {
      setGuardando(false)
      setConfirmarRetiro(false)
    }
  }

  // Botones de esta zona: guardar sin cambiar donde esta publicada, o retirarla de la web.
  async function guardarConAviso(estado: EstadoWeb) {
    const antes = estadoWeb
    setAviso(null)
    const r = await guardar(estado)
    if (r.ok) {
      const texto =
        estado === 'publicada'
          ? 'Cambios guardados. La noticia sigue publicada en la web.'
          : antes === 'publicada'
            ? 'Noticia retirada de la web. Ahora es un borrador.'
            : 'Borrador guardado.'
      setAviso({ tipo: 'ok', texto })
    } else if (r.error) {
      setAviso({ tipo: 'error', texto: r.error })
    }
  }

  if (cargando) return <p className="py-8 text-[#1a1a1a]/60">Cargando noticia…</p>
  if (errorCarga) return <p role="alert" className={avisoError}>{errorCarga}</p>
  if (antigua) {
    return (
      <p className={`${avisoError} text-base`}>
        Esta es una edición antigua (formato anterior al editor de bloques). Se conserva en el historial, pero no se puede
        editar ni publicar.
      </p>
    )
  }

  const publicada = estadoWeb === 'publicada'

  return (
    <section>
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#1a1a1a]/70">
        <p>
          Web: <strong className={publicada ? 'text-[#2f6b3a]' : ''}>{publicada ? 'Publicada' : 'Borrador'}</strong>
          {publicada && publicadaEl ? ` · desde el ${fecha(publicadaEl)}` : ''}
        </p>
        <p>
          Correo: <strong className={enviado.sent ? 'text-[#2f6b3a]' : ''}>{enviado.sent ? 'Enviado' : 'No enviado'}</strong>
          {enviado.sent && enviado.sentAt ? ` · el ${fecha(enviado.sentAt)}` : ''}
        </p>
      </div>

      {enviado.sent && (
        <p className={`${avisoOk} mb-5`}>
          El correo de esta noticia ya se envió. Puedes seguir corrigiendo la noticia, pero los cambios solo se verán en la web.
        </p>
      )}
      {correoAparte && (
        <p className="mb-5 border-l-4 border-[#b7791f] bg-[#b7791f]/10 px-4 py-3 text-[#6b4a10]">
          Esta noticia tenía un correo escrito aparte con el editor anterior. Ahora el correo lleva lo mismo que ves aquí: al
          guardar o pedir la vista previa, ese correo anterior se reemplaza.
        </p>
      )}

      <div className="mb-6">
        <label className={etiqueta} htmlFor="titular">Titular</label>
        <input id="titular" className={`${campo} ${titular} text-lg font-bold`} value={titulo} maxLength={200}
          placeholder="El titular de la noticia" aria-describedby="titular-ayuda" onChange={e => setTitulo(e.target.value)} />
        <p id="titular-ayuda" className="mt-1 text-sm text-[#1a1a1a]/60">Es el titular en la web y también el asunto del correo.</p>
      </div>

      <div className="mb-8">
        <p className={etiqueta}>Imagen de portada</p>
        <CampoImagen url={portada} onUrl={setPortada} />
      </div>

      <h2 className={`${titular} mb-3 text-2xl font-bold`}>Contenido de la noticia</h2>
      <EditorBloques bloques={bloques} setBloques={setBloques} modo="web" maxImagenes={MAX_IMAGENES - (portada ? 1 : 0)} />

      <div className="mt-8 border-t border-[#1a1a1a]/20 pt-5">
        <div className="grid gap-2 sm:flex">
          {publicada ? (
            <>
              <button type="button" className={botonPrimario} disabled={guardando} onClick={() => guardarConAviso('publicada')}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button type="button" className={botonSecundario} disabled={guardando} onClick={() => setConfirmarRetiro(true)}>
                Retirar de la web
              </button>
            </>
          ) : (
            <button type="button" className={`${botonSecundario} w-full sm:w-auto`} disabled={guardando} onClick={() => guardarConAviso('borrador')}>
              {guardando ? 'Guardando…' : 'Guardar borrador'}
            </button>
          )}
        </div>
        {confirmarRetiro && (
          <div role="alertdialog" aria-label="Confirmar retiro" className="mt-4 flex flex-wrap items-center gap-2 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-3">
            <p className="mr-auto text-[#6b1414]">¿Retirar la noticia de la web? Dejará de verse en /noticias.</p>
            <button type="button" className={botonPeligro} onClick={() => guardarConAviso('borrador')}>Sí, retirar</button>
            <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setConfirmarRetiro(false)}>Cancelar</button>
          </div>
        )}
        {pendiente && <p className="mt-3 text-sm font-semibold text-[#8b1a1a]">● Hay cambios sin guardar</p>}
        {aviso && (
          <p role={aviso.tipo === 'error' ? 'alert' : 'status'} className={`${aviso.tipo === 'ok' ? avisoOk : avisoError} mt-4`}>
            {aviso.texto}
          </p>
        )}
      </div>

      <RevisarYPublicar
        id={id}
        enviado={enviado.sent}
        publicada={publicada}
        ocupado={guardando}
        titular={titulo}
        guardar={guardar}
        onEnviado={sentAt => setEnviado({ sent: true, sentAt })}
      />
    </section>
  )
}
