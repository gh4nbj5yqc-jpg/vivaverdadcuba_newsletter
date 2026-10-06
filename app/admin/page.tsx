'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Suscriptor = { id: string; email: string; created_at: string }
type Edicion = { id: string; title: string; content: string; image_url: string | null; sent: boolean; published_at: string }

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  const [seccion, setSeccion] = useState<'enviar' | 'suscriptores' | 'historial'>('enviar')

  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([])
  const [cargandoSuscriptores, setCargandoSuscriptores] = useState(false)

  const [ediciones, setEdiciones] = useState<Edicion[]>([])
  const [cargandoEdiciones, setCargandoEdiciones] = useState(false)

  async function verificarPassword() {
    setErrorLogin('')
    const res = await fetch('/api/check-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    const data = await res.json()
    if (data.ok) {
      setAutenticado(true)
    } else {
      setErrorLogin('Contraseña incorrecta')
    }
  }

  function sesionExpirada() {
    setAutenticado(false)
    setCargando(false)
    setSubiendoImagen(false)
    setCargandoSuscriptores(false)
    setCargandoEdiciones(false)
    setErrorLogin('Tu sesión expiró. Vuelve a entrar.')
  }

  async function cargarSuscriptores() {
    setCargandoSuscriptores(true)
    const res = await fetch('/api/subscribers')
    if (res.status === 401) return sesionExpirada()
    const data = await res.json()
    setSuscriptores(data.suscriptores || [])
    setCargandoSuscriptores(false)
  }

  async function eliminarSuscriptor(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este suscriptor?')) return
    const res = await fetch('/api/subscribers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.status === 401) return sesionExpirada()
    cargarSuscriptores()
  }

  async function cargarEdiciones() {
    setCargandoEdiciones(true)
    const res = await fetch('/api/editions')
    if (res.status === 401) return sesionExpirada()
    const data = await res.json()
    setEdiciones(data.ediciones || [])
    setCargandoEdiciones(false)
  }

  useEffect(() => {
    if (autenticado && seccion === 'suscriptores') cargarSuscriptores()
    if (autenticado && seccion === 'historial') cargarEdiciones()
  }, [autenticado, seccion])

  function seleccionarImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (archivo) {
      setImagen(archivo)
      setImagenPreview(URL.createObjectURL(archivo))
    }
  }

  async function enviar() {
    if (!titulo || !contenido) {
      setMensaje('Por favor escribe el titulo y el contenido')
      return
    }

    setCargando(true)
    setMensaje('')

    let imagenUrl = ''

    if (imagen) {
      setSubiendoImagen(true)
      const resUrl = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: imagen.name })
      })
      if (resUrl.status === 401) return sesionExpirada()
      const firmada = await resUrl.json()

      const { error: errorSubida } = firmada.token
        ? await supabase.storage
            .from('newsletter-images')
            .uploadToSignedUrl(firmada.ruta, firmada.token, imagen)
        : { error: { message: firmada.error || 'no se pudo preparar la subida' } }

      if (errorSubida) {
        setMensaje('Error subiendo la imagen: ' + errorSubida.message)
        setCargando(false)
        setSubiendoImagen(false)
        return
      }

      imagenUrl = firmada.publicUrl
      setSubiendoImagen(false)
    }

    const res = await fetch('/api/send-edition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, contenido, imagenUrl })
    })
    if (res.status === 401) return sesionExpirada()
    const data = await res.json()
    if (data.ok) {
      setMensaje('Edicion enviada exitosamente!')
      setTitulo('')
      setContenido('')
      setImagen(null)
      setImagenPreview('')
    } else {
      setMensaje('Error: ' + (data.error || 'algo salio mal'))
    }
    setCargando(false)
  }

  if (!autenticado) {
    return (
      <div className='min-h-screen bg-white p-8 max-w-sm mx-auto flex flex-col justify-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>Acceso al Panel de Admin</h1>
        <input
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') verificarPassword() }}
          className='w-full border border-gray-300 rounded p-3 text-gray-900 mb-4'
          placeholder='Contraseña'
        />
        <button
          onClick={verificarPassword}
          className='bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800'
        >
          Entrar
        </button>
        {errorLogin && <p className='mt-4 text-red-600 font-semibold'>{errorLogin}</p>}
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white p-8 max-w-2xl mx-auto'>
      <h1 className='text-3xl font-bold text-gray-900 mb-6'>Panel de Admin</h1>

      <div className='flex gap-2 mb-8 border-b border-gray-200'>
        <button
          onClick={() => setSeccion('enviar')}
          className={`px-4 py-2 font-semibold ${seccion === 'enviar' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
        >
          Enviar edición
        </button>
        <button
          onClick={() => setSeccion('suscriptores')}
          className={`px-4 py-2 font-semibold ${seccion === 'suscriptores' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
        >
          Suscriptores
        </button>
        <button
          onClick={() => setSeccion('historial')}
          className={`px-4 py-2 font-semibold ${seccion === 'historial' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
        >
          Historial
        </button>
      </div>

      {seccion === 'enviar' && (
        <div>
          <div className='mb-6'>
            <label className='block text-gray-700 font-semibold mb-2'>Imagen principal (opcional)</label>
            <input
              type='file'
              accept='image/*'
              onChange={seleccionarImagen}
              className='w-full border border-gray-300 rounded p-3 text-gray-900'
            />
            {imagenPreview && (
              <img src={imagenPreview} alt='Vista previa' className='mt-3 rounded max-h-64 object-cover' />
            )}
          </div>

          <div className='mb-4'>
            <label className='block text-gray-700 font-semibold mb-2'>Titulo de la edicion</label>
            <input
              type='text'
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className='w-full border border-gray-300 rounded p-3 text-gray-900'
              placeholder='Ej: Edicion 1 - Noticias de la semana'
            />
          </div>
          <div className='mb-6'>
            <label className='block text-gray-700 font-semibold mb-2'>Contenido</label>
            <textarea
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              className='w-full border border-gray-300 rounded p-3 text-gray-900 h-64'
              placeholder='Escribe aqui el contenido de tu newsletter...'
            />
          </div>
          <button
            onClick={enviar}
            disabled={cargando}
            className='bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 disabled:opacity-50'
          >
            {subiendoImagen ? 'Subiendo imagen...' : cargando ? 'Enviando...' : 'Enviar a suscriptores'}
          </button>
          {mensaje && <p className='mt-4 text-green-600 font-semibold'>{mensaje}</p>}
        </div>
      )}

      {seccion === 'suscriptores' && (
        <div>
          <p className='text-gray-600 mb-4'>{suscriptores.length} suscriptores</p>
          {cargandoSuscriptores ? (
            <p>Cargando...</p>
          ) : (
            <div className='divide-y divide-gray-200'>
              {suscriptores.map(s => (
                <div key={s.id} className='flex justify-between items-center py-3'>
                  <div>
                    <p className='font-medium text-gray-900'>{s.email}</p>
                    <p className='text-sm text-gray-500'>
                      {new Date(s.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarSuscriptor(s.id)}
                    className='text-red-600 hover:text-red-800 font-semibold text-sm'
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {seccion === 'historial' && (
        <div>
          {cargandoEdiciones ? (
            <p>Cargando...</p>
          ) : ediciones.length === 0 ? (
            <p className='text-gray-500'>No has enviado ninguna edición todavía.</p>
          ) : (
            <div className='space-y-4'>
              {ediciones.map(ed => (
                <div key={ed.id} className='border border-gray-200 rounded p-4'>
                  <div className='flex justify-between items-start'>
                    <h3 className='font-semibold text-gray-900'>{ed.title}</h3>
                    <span className='text-xs text-gray-500'>
                      {new Date(ed.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  {ed.image_url && (
                    <img src={ed.image_url} alt={ed.title} className='mt-2 rounded max-h-40 object-cover' />
                  )}
                  <p className='text-gray-600 text-sm mt-2 line-clamp-3'>{ed.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}