'use client'

import { useCallback, useEffect, useState } from 'react'
import { EVENTO_SESION_EXPIRADA } from '@/lib/admin-cliente'
import EditorNoticia from '@/components/admin/EditorNoticia'
import Historial from '@/components/admin/Historial'
import Suscriptores from '@/components/admin/Suscriptores'
import ChatAdmin from '@/components/admin/ChatAdmin'
import { avisoError, botonConfirmar, botonDiscreto, botonPrimario, botonSecundario, campo, etiqueta } from '@/components/admin/estilos'

type Pestana = 'noticia' | 'suscriptores' | 'historial' | 'chat'

// "Noticia" es el editor unico: lo que se escribe ahi sirve para la web y para el correo.
const PESTANAS: { id: Pestana; nombre: string }[] = [
  { id: 'noticia', nombre: 'Noticia' },
  { id: 'suscriptores', nombre: 'Suscriptores' },
  { id: 'historial', nombre: 'Historial' },
  { id: 'chat', nombre: 'Chat' },
]

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [entrando, setEntrando] = useState(false)

  const [pestana, setPestana] = useState<Pestana>('noticia')
  // Cambiar "clave" vuelve a montar el editor con otra noticia (o una nueva).
  const [abierta, setAbierta] = useState<{ id: string | null; clave: number }>({ id: null, clave: 0 })
  const [hayCambios, setHayCambios] = useState(false)
  const [descartar, setDescartar] = useState<null | (() => void)>(null)

  useEffect(() => {
    function expiro() {
      setAutenticado(false)
      setErrorLogin('Tu sesión expiró. Vuelve a entrar.')
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, expiro)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, expiro)
  }, [])

  const onCambiosPendientes = useCallback((hay: boolean) => setHayCambios(hay), [])

  async function verificarPassword(e: React.FormEvent) {
    e.preventDefault()
    setErrorLogin('')
    setEntrando(true)
    try {
      const res = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) {
        setAutenticado(true)
        setPassword('')
      } else {
        setErrorLogin('Contraseña incorrecta')
      }
    } catch {
      setErrorLogin('No hay conexión. Inténtalo de nuevo.')
    } finally {
      setEntrando(false)
    }
  }

  // Si hay cambios sin guardar, pide confirmación antes de cambiar de noticia.
  function protegerCambios(accion: () => void) {
    if (hayCambios) setDescartar(() => accion)
    else accion()
  }

  function abrirNoticia(id: string | null) {
    protegerCambios(() => {
      setAbierta(prev => ({ id, clave: prev.clave + 1 }))
      setHayCambios(false)
      setPestana('noticia')
      setDescartar(null)
    })
  }

  // Si se borra la noticia abierta en el editor, se cambia a una noticia nueva.
  function noticiaEliminada(id: string) {
    if (abierta.id !== id) return
    setAbierta(prev => ({ id: null, clave: prev.clave + 1 }))
    setHayCambios(false)
    setDescartar(null)
  }

  if (!autenticado) {
    return (
      <main className="flex min-h-screen flex-col justify-center bg-fondo px-4 py-10 font-sans text-tinta">
        <div className="mx-auto w-full max-w-sm">
          <header className="px-1 text-[1.75rem] font-extrabold leading-[1.08] tracking-[-0.03em]">
            <p>Viva Verdad Cuba</p>
            <h1 className="text-tinta-3">Panel de administración</h1>
          </header>
          <form onSubmit={verificarPassword} className="tarjeta mt-6 flex flex-col p-5">
            <label className={etiqueta} htmlFor="password">Contraseña</label>
            <input id="password" type="password" autoComplete="current-password" value={password}
              onChange={e => setPassword(e.target.value)} className={`${campo} mb-4`} required />
            <button type="submit" disabled={entrando} className={botonPrimario}>{entrando ? 'Entrando…' : 'Entrar'}</button>
            {errorLogin && <p role="alert" className={`${avisoError} mt-4`}>{errorLogin}</p>}
          </form>
        </div>
      </main>
    )
  }

  const editando = pestana === 'noticia'

  return (
    <main className="min-h-screen bg-fondo font-sans text-tinta">
      <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <header className="pt-8 pb-5 text-[1.75rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:pt-10 sm:text-4xl">
          <p>Viva Verdad Cuba</p>
          <h1 className="text-tinta-3">Panel de administración</h1>
        </header>

        {/* Pestañas: un selector de cristal que se queda arriba, con una pastilla que se desliza. */}
        <nav aria-label="Secciones del panel" className="cristal cristal-barra sticky top-[calc(0.5rem+env(safe-area-inset-top,0px))] z-10 grid grid-cols-4 rounded-full p-1">
          <span
            aria-hidden="true"
            style={{ translate: `${PESTANAS.findIndex(p => p.id === pestana) * 100}% 0` }}
            className="absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-superficie shadow-[0_1px_4px_rgba(0,0,0,0.14)] transition-[translate] duration-300 ease-[cubic-bezier(0.3,1.3,0.5,1)] motion-reduce:transition-none"
          />
          {PESTANAS.map(p => (
            <button key={p.id} type="button" onClick={() => setPestana(p.id)} aria-current={pestana === p.id ? 'page' : undefined}
              className={`relative min-h-10 rounded-full px-1 text-[0.8125rem] font-semibold transition-colors sm:text-[0.9375rem] ${pestana === p.id ? 'text-tinta' : 'text-tinta-2'}`}>
              {p.nombre}
            </button>
          ))}
        </nav>

        {descartar && (
          <div role="alertdialog" aria-label="Cambios sin guardar" className={`${avisoError} mt-4 flex flex-wrap items-center gap-2`}>
            <p className="mr-auto">Tienes cambios sin guardar en la noticia abierta. ¿Descartarlos?</p>
            <button type="button" className={botonConfirmar} onClick={descartar}>Descartar cambios</button>
            <button type="button" className={botonDiscreto} onClick={() => setDescartar(null)}>Seguir editando</button>
          </div>
        )}

        {editando && (
          <div className="mt-5 mb-5 flex items-center justify-between gap-3">
            <p className="text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">{abierta.id ? 'Editando noticia' : 'Noticia nueva'}</p>
            <button type="button" onClick={() => abrirNoticia(null)} className={`${botonSecundario} shrink-0 whitespace-nowrap`}>
              + Nueva noticia
            </button>
          </div>
        )}

        {/* El editor sigue montado al pasar a Suscriptores o Historial para no perder lo escrito. */}
        <div hidden={!editando}>
          <EditorNoticia key={abierta.clave} idInicial={abierta.id} onCambiosPendientes={onCambiosPendientes} />
        </div>

        <div className="mt-6">
          {pestana === 'suscriptores' && <Suscriptores />}
          {pestana === 'historial' && <Historial onAbrir={abrirNoticia} onEliminada={noticiaEliminada} />}
          {pestana === 'chat' && <ChatAdmin />}
        </div>
      </div>
    </main>
  )
}
