'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
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

  async function enviar() {
    if (!titulo || !contenido) {
      setMensaje('Por favor escribe el titulo y el contenido')
      return
    }
    setCargando(true)
    setMensaje('')
    const res = await fetch('/api/send-edition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, contenido })
    })
    const data = await res.json()
    if (data.ok) {
      setMensaje('Edicion enviada exitosamente!')
      setTitulo('')
      setContenido('')
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
        {cargando ? 'Enviando...' : 'Enviar a suscriptores'}
      </button>
      {mensaje && <p className='mt-4 text-green-600 font-semibold'>{mensaje}</p>}
    </div>
  )
}