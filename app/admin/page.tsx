'use client'

import { useCallback, useEffect, useState } from 'react'
import { EVENTO_SESION_EXPIRADA } from '@/lib/admin-cliente'
import EditorNoticia from '@/components/admin/EditorNoticia'
import Historial from '@/components/admin/Historial'
import Suscriptores from '@/components/admin/Suscriptores'
import { avisoError, botonPeligro, botonPrimario, campo, etiqueta, titular } from '@/components/admin/estilos'

type Pestana = 'correo' | 'web' | 'suscriptores' | 'historial'

const PESTANAS: { id: Pestana; nombre: string }[] = [
  { id: 'correo', nombre: 'Correo' },
  { id: 'web', nombre: 'Web' },
  { id: 'suscriptores', nombre: 'Suscriptores' },
  { id: 'historial', nombre: 'Historial' },
]

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [entrando, setEntrando] = useState(false)

  const [pestana, setPestana] = useState<Pestana>('correo')
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

  function abrirNoticia(id: string | null, parte: 'correo' | 'web') {
    protegerCambios(() => {
      setAbierta(prev => ({ id, clave: prev.clave + 1 }))
      setHayCambios(false)
      setPestana(parte)
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
      <main className="min-h-screen bg-[#fbf8f1] px-5 font-[family-name:var(--font-source-serif)] text-[#1a1a1a]">
        <form onSubmit={verificarPassword} className="mx-auto flex min-h-screen max-w-sm flex-col justify-center py-10">
          <p className={`${titular} text-center text-3xl font-black`}>Viva Verdad Cuba</p>
          <div className="mt-4 border-t-[3px] border-b border-[#1a1a1a] pt-[3px]" />
          <h1 className="mt-6 mb-6 text-center text-xs uppercase tracking-[0.25em] text-[#1a1a1a]/60">Panel de administración</h1>
          <label className={etiqueta} htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} className={`${campo} mb-4`} required />
          <button type="submit" disabled={entrando} className={botonPrimario}>{entrando ? 'Entrando…' : 'Entrar'}</button>
          {errorLogin && <p role="alert" className={`${avisoError} mt-4`}>{errorLogin}</p>}
        </form>
      </main>
    )
  }

  const editando = pestana === 'correo' || pestana === 'web'

  return (
    <main className="min-h-screen bg-[#fbf8f1] font-[family-name:var(--font-source-serif)] text-[#1a1a1a]">
      <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-8">
        <header className="pt-6 pb-4 text-center">
          <p className={`${titular} text-2xl font-black sm:text-4xl`}>Viva Verdad Cuba</p>
          <div className="mt-3 border-t-[3px] border-b border-[#1a1a1a] pt-[3px]" />
          <h1 className="mt-2 text-xs uppercase tracking-[0.25em] text-[#1a1a1a]/60">Panel de administración</h1>
        </header>

        <nav className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 grid grid-cols-4 border-b border-[#1a1a1a]/30 bg-[#fbf8f1] px-4 sm:-mx-8 sm:px-8">
          {PESTANAS.map(p => (
            <button key={p.id} type="button" onClick={() => setPestana(p.id)} aria-current={pestana === p.id ? 'page' : undefined}
              className={`min-h-12 border-b-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm ${pestana === p.id ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-transparent text-[#1a1a1a]/50'}`}>
              {p.nombre}
            </button>
          ))}
        </nav>

        {descartar && (
          <div role="alertdialog" aria-label="Cambios sin guardar" className="mt-4 flex flex-wrap items-center gap-2 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-3">
            <p className="mr-auto text-[#6b1414]">Tienes cambios sin guardar en la noticia abierta. ¿Descartarlos?</p>
            <button type="button" className={botonPeligro} onClick={descartar}>Descartar cambios</button>
            <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setDescartar(null)}>Seguir editando</button>
          </div>
        )}

        {editando && (
          <div className="mt-4 mb-6 flex items-center justify-between gap-3 border-b border-[#1a1a1a]/15 pb-4">
            <p className="text-sm text-[#1a1a1a]/70">{abierta.id ? 'Editando una noticia guardada' : 'Noticia nueva'}</p>
            <button type="button" onClick={() => abrirNoticia(null, pestana as 'correo' | 'web')}
              className="min-h-11 border border-[#1a1a1a]/40 px-4 text-sm font-semibold hover:border-[#1a1a1a]">
              + Nueva noticia
            </button>
          </div>
        )}

        {/* El editor sigue montado al pasar a Suscriptores o Historial para no perder lo escrito. */}
        <div hidden={!editando}>
          <EditorNoticia key={abierta.clave} idInicial={abierta.id} parte={pestana === 'web' ? 'web' : 'correo'}
            onCambiosPendientes={onCambiosPendientes} />
        </div>

        <div className="mt-6">
          {pestana === 'suscriptores' && <Suscriptores />}
          {pestana === 'historial' && <Historial onAbrir={abrirNoticia} onEliminada={noticiaEliminada} />}
        </div>
      </div>
    </main>
  )
}
