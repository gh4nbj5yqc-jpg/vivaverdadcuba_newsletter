'use client'

import { useEffect, useMemo, useState } from 'react'
import { estructuraInicial, MAX_IMAGENES, type Bloque } from '@/lib/bloques'
import { pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import type { NoticiaAdmin } from '@/lib/noticias-admin'
import EditorBloques, { type ArticuloPublicado } from './EditorBloques'
import CampoImagen from './CampoImagen'
import AccionesCorreo from './AccionesCorreo'
import { avisoError, avisoOk, botonPeligro, botonPrimario, botonSecundario, campo, etiqueta, titular } from './estilos'

type Parte = 'correo' | 'web'
type Aviso = { tipo: 'ok' | 'error'; texto: string } | null

type Props = {
  idInicial: string | null
  parte: Parte
  onCambiosPendientes: (hay: boolean) => void
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

function articulosDe(lista: NoticiaAdmin[]): ArticuloPublicado[] {
  return lista
    .filter(n => n.web_status === 'publicada' && n.web_blocks !== null)
    .map(n => ({ id: String(n.id), titulo: n.web_title || '(sin titular)' }))
}

export default function EditorNoticia({ idInicial, parte, onCambiosPendientes }: Props) {
  const [id, setId] = useState<string | null>(idInicial)
  const [cargando, setCargando] = useState(Boolean(idInicial))
  const [errorCarga, setErrorCarga] = useState('')
  const [antigua, setAntigua] = useState(false)

  // Correo
  const [asunto, setAsunto] = useState('')
  const [bloquesCorreo, setBloquesCorreo] = useState<Bloque[]>(estructuraInicial)
  const [enviado, setEnviado] = useState<{ sent: boolean; sentAt: string | null }>({ sent: false, sentAt: null })

  // Web
  const [titulo, setTitulo] = useState('')
  const [portada, setPortada] = useState('')
  const [bloquesWeb, setBloquesWeb] = useState<Bloque[]>(estructuraInicial)
  const [estadoWeb, setEstadoWeb] = useState<'borrador' | 'publicada'>('borrador')
  const [publicadaEl, setPublicadaEl] = useState<string | null>(null)
  const [confirmarRetiro, setConfirmarRetiro] = useState(false)

  const [articulos, setArticulos] = useState<ArticuloPublicado[]>([])
  const [guardando, setGuardando] = useState<Parte | null>(null)
  const [aviso, setAviso] = useState<Record<Parte, Aviso>>({ correo: null, web: null })

  const fotoCorreo = JSON.stringify({ asunto, bloquesCorreo })
  const fotoWeb = JSON.stringify({ titulo, portada, bloquesWeb })
  const [guardado, setGuardado] = useState<{ correo: string; web: string } | null>(null)
  const pendientes = useMemo(
    () => ({
      correo: guardado ? guardado.correo !== fotoCorreo : false,
      web: guardado ? guardado.web !== fotoWeb : false,
    }),
    [guardado, fotoCorreo, fotoWeb]
  )

  // Foto inicial de una noticia nueva: no hay cambios hasta que se escribe algo.
  if (guardado === null && !idInicial) setGuardado({ correo: fotoCorreo, web: fotoWeb })

  useEffect(() => {
    onCambiosPendientes(pendientes.correo || pendientes.web)
  }, [pendientes, onCambiosPendientes])

  useEffect(() => {
    if (!pendientes.correo && !pendientes.web) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [pendientes])

  function aplicar(n: NoticiaAdmin) {
    const correo = n.blocks ?? estructuraInicial()
    const web = n.web_blocks ?? estructuraInicial()
    setId(String(n.id))
    setAntigua(n.blocks === null && n.web_blocks === null)
    setAsunto(n.title ?? '')
    setBloquesCorreo(correo)
    setEnviado({ sent: Boolean(n.sent), sentAt: n.sent_at })
    setTitulo(n.web_title ?? '')
    setPortada(n.web_cover_url ?? '')
    setBloquesWeb(web)
    setEstadoWeb(n.web_status)
    setPublicadaEl(n.web_published_at)
    setGuardado({
      correo: JSON.stringify({ asunto: n.title ?? '', bloquesCorreo: correo }),
      web: JSON.stringify({ titulo: n.web_title ?? '', portada: n.web_cover_url ?? '', bloquesWeb: web }),
    })
  }

  // Al guardar solo una parte, la otra conserva lo que se está escribiendo.
  function aplicarParte(n: NoticiaAdmin, p: Parte) {
    setId(String(n.id))
    setGuardado(prev => {
      const base = prev ?? { correo: '', web: '' }
      return p === 'correo'
        ? { ...base, correo: JSON.stringify({ asunto: n.title ?? '', bloquesCorreo: n.blocks ?? [] }) }
        : { ...base, web: JSON.stringify({ titulo: n.web_title ?? '', portada: n.web_cover_url ?? '', bloquesWeb: n.web_blocks ?? [] }) }
    })
    if (p === 'correo') {
      setAsunto(n.title ?? '')
      setBloquesCorreo(n.blocks ?? [])
    } else {
      setTitulo(n.web_title ?? '')
      setPortada(n.web_cover_url ?? '')
      setBloquesWeb(n.web_blocks ?? [])
      setEstadoWeb(n.web_status)
      setPublicadaEl(n.web_published_at)
    }
  }

  async function cargarArticulos() {
    try {
      const { ediciones } = await pedirJson<{ ediciones: NoticiaAdmin[] }>('/api/editions')
      setArticulos(articulosDe(ediciones))
    } catch {
      // Si falla, el desplegable queda vacío; el guardado avisará si hay un enlace roto.
    }
  }

  useEffect(() => {
    let vigente = true
    ;(async () => {
      try {
        if (idInicial) {
          const { edicion } = await pedirJson<{ edicion: NoticiaAdmin }>(`/api/editions/${encodeURIComponent(idInicial)}`)
          if (vigente) aplicar(edicion)
        }
      } catch (e) {
        if (vigente && !(e instanceof SesionExpirada)) {
          setErrorCarga(e instanceof Error ? e.message : 'No se pudo cargar la noticia.')
        }
      } finally {
        if (vigente) setCargando(false)
      }
      if (vigente) await cargarArticulos()
    })()
    return () => { vigente = false }
  }, [idInicial])

  async function guardar(p: Parte, estado?: 'borrador' | 'publicada'): Promise<NoticiaAdmin | null> {
    setGuardando(p)
    setAviso(prev => ({ ...prev, [p]: null }))
    const cuerpo =
      p === 'correo'
        ? { parte: 'correo', asunto, bloques: bloquesCorreo }
        : { parte: 'web', titulo, portada, bloques: bloquesWeb, estado }
    try {
      const { edicion } = await pedirJson<{ edicion: NoticiaAdmin }>(
        id ? `/api/editions/${encodeURIComponent(id)}` : '/api/editions',
        { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }
      )
      aplicarParte(edicion, p)
      const texto =
        p === 'correo'
          ? 'Correo guardado.'
          : edicion.web_status === 'publicada'
            ? estadoWeb === 'publicada' ? 'Cambios guardados. El artículo sigue publicado.' : '¡Publicado en la web!'
            : estadoWeb === 'publicada' ? 'Artículo retirado de la web. Ahora es un borrador.' : 'Borrador guardado.'
      setAviso(prev => ({ ...prev, [p]: { tipo: 'ok', texto } }))
      if (p === 'web') await cargarArticulos()
      return edicion
    } catch (e) {
      if (!(e instanceof SesionExpirada)) {
        setAviso(prev => ({ ...prev, [p]: { tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar.' } }))
      }
      return null
    } finally {
      setGuardando(null)
      setConfirmarRetiro(false)
    }
  }

  if (cargando) return <p className="py-8 text-[#1a1a1a]/60">Cargando noticia…</p>
  if (errorCarga) return <p role="alert" className={avisoError}>{errorCarga}</p>
  if (antigua) {
    return (
      <p className={`${avisoError} text-base`}>
        Esta es una edición antigua (formato anterior al editor de bloques). Se conserva en el historial, pero no se puede
        editar ni publicar en la web.
      </p>
    )
  }

  const avisoActual = aviso[parte]
  const cajaAviso = avisoActual && (
    <p role={avisoActual.tipo === 'error' ? 'alert' : 'status'} className={`${avisoActual.tipo === 'ok' ? avisoOk : avisoError} mt-4`}>
      {avisoActual.texto}
    </p>
  )
  const pendiente = pendientes[parte] && (
    <p className="mt-3 text-sm font-semibold text-[#8b1a1a]">● Hay cambios sin guardar</p>
  )

  if (parte === 'correo') {
    const bloqueado = enviado.sent
    return (
      <section>
        {bloqueado && (
          <p className={`${avisoOk} mb-5`}>Este correo ya se envió{enviado.sentAt ? ` el ${fecha(enviado.sentAt)}` : ''}. Ya no se puede modificar.</p>
        )}
        <div className="mb-6">
          <label className={etiqueta} htmlFor="asunto">Asunto del correo</label>
          <input id="asunto" className={campo} value={asunto} maxLength={200} disabled={bloqueado}
            placeholder="Ej.: Lo más importante de la semana" onChange={e => setAsunto(e.target.value)} />
        </div>

        <h2 className={`${titular} mb-3 text-2xl font-bold`}>Contenido del correo</h2>
        <EditorBloques bloques={bloquesCorreo} setBloques={setBloquesCorreo} modo="correo"
          maxImagenes={MAX_IMAGENES} articulos={articulos} deshabilitado={bloqueado} />

        <div className="mt-8 border-t border-[#1a1a1a]/20 pt-5">
          <button type="button" className={`${botonPrimario} w-full sm:w-auto`} disabled={bloqueado || guardando !== null}
            onClick={() => guardar('correo')}>
            {guardando === 'correo' ? 'Guardando…' : 'Guardar correo'}
          </button>
          {pendiente}
          {cajaAviso}
        </div>

        <AccionesCorreo
          bloqueado={bloqueado}
          ocupado={guardando !== null}
          asunto={asunto}
          // Antes de la vista previa o de cualquier envío se guarda SIEMPRE el correo.
          guardarPrimero={async () => {
            if (bloqueado) return id
            const n = await guardar('correo')
            return n ? String(n.id) : null
          }}
          onEnviado={sentAt => setEnviado({ sent: true, sentAt })}
        />
      </section>
    )
  }

  const publicada = estadoWeb === 'publicada'
  return (
    <section>
      <p className="mb-5 text-sm text-[#1a1a1a]/70">
        Estado: <strong className={publicada ? 'text-[#2f6b3a]' : ''}>{publicada ? 'Publicada' : 'Borrador'}</strong>
        {publicada && publicadaEl ? ` · desde el ${fecha(publicadaEl)}` : ''}
      </p>

      <div className="mb-6">
        <label className={etiqueta} htmlFor="titular">Titular</label>
        <input id="titular" className={`${campo} ${titular} text-lg font-bold`} value={titulo} maxLength={200}
          placeholder="El titular del artículo" onChange={e => setTitulo(e.target.value)} />
      </div>

      <div className="mb-8">
        <p className={etiqueta}>Imagen de portada</p>
        <CampoImagen url={portada} onUrl={setPortada} />
      </div>

      <h2 className={`${titular} mb-3 text-2xl font-bold`}>Contenido del artículo</h2>
      <EditorBloques bloques={bloquesWeb} setBloques={setBloquesWeb} modo="web" maxImagenes={MAX_IMAGENES - (portada ? 1 : 0)} />

      <div className="mt-8 border-t border-[#1a1a1a]/20 pt-5">
        <div className="grid gap-2 sm:flex">
          {publicada ? (
            <>
              <button type="button" className={botonPrimario} disabled={guardando !== null} onClick={() => guardar('web', 'publicada')}>
                {guardando === 'web' ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button type="button" className={botonSecundario} disabled={guardando !== null} onClick={() => setConfirmarRetiro(true)}>
                Retirar de la web
              </button>
            </>
          ) : (
            <>
              <button type="button" className={botonSecundario} disabled={guardando !== null} onClick={() => guardar('web', 'borrador')}>
                {guardando === 'web' ? 'Guardando…' : 'Guardar borrador'}
              </button>
              <button type="button" className={botonPrimario} disabled={guardando !== null} onClick={() => guardar('web', 'publicada')}>
                Publicar en la web
              </button>
            </>
          )}
        </div>
        {confirmarRetiro && (
          <div role="alertdialog" aria-label="Confirmar retiro" className="mt-4 flex flex-wrap items-center gap-2 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-3">
            <p className="mr-auto text-[#6b1414]">¿Retirar el artículo de la web? Dejará de verse en /noticias.</p>
            <button type="button" className={botonPeligro} onClick={() => guardar('web', 'borrador')}>Sí, retirar</button>
            <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setConfirmarRetiro(false)}>Cancelar</button>
          </div>
        )}
        {pendiente}
        {cajaAviso}
      </div>
    </section>
  )
}
