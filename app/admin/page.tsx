'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

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
      const nombreArchivo = `${Date.now()}-${imagen.name}`
      const { error: errorSubida } = await supabase.storage
        .from('newsletter-images')
        .upload(nombreArchivo, imagen)

      if (errorSubida) {
        setMensaje('Error subiendo la imagen: ' + errorSubida.message)
        setCargando(false)
        setSubiendoImagen(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('newsletter-images')
        .getPublicUrl(nombreArchivo)

      imagenUrl = urlData.publicUrl
      setSubiendoImagen(false)
    }

    const res = await fetch('/api/send-edition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, contenido, imagenUrl })
    })
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
      <h1 className='text-3xl font-bold text-gray-900 mb-8'>Panel de Admin</h1>

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
  )
}