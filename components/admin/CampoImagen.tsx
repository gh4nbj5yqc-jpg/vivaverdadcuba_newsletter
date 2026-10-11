'use client'

import { useId, useState } from 'react'
import { subirImagen } from '@/lib/imagen'
import { avisoError, botonSecundario } from './estilos'

type Props = {
  url: string
  onUrl: (url: string) => void
  deshabilitado?: boolean
}

// Elegir una foto del computador o del teléfono: se reduce, se convierte a JPEG y se sube.
export default function CampoImagen({ url, onUrl, deshabilitado }: Props) {
  const idInput = useId()
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!archivo) return
    setError('')
    setSubiendo(true)
    try {
      onUrl(await subirImagen(archivo))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mb-3 max-h-72 w-full rounded-2xl bg-relleno object-contain" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={idInput}
          className={`${botonSecundario} cursor-pointer ${subiendo || deshabilitado ? 'pointer-events-none opacity-50' : ''}`}
        >
          {subiendo ? 'Subiendo…' : url ? 'Cambiar imagen' : 'Elegir imagen'}
        </label>
        <input
          id={idInput}
          type="file"
          accept="image/*,.heic,.heif"
          onChange={elegir}
          disabled={subiendo || deshabilitado}
          className="sr-only"
        />
        {url && !subiendo && !deshabilitado && (
          <button type="button" onClick={() => onUrl('')} className="min-h-11 rounded-full px-2 text-[0.9375rem] font-semibold text-acento-tinta">
            Quitar imagen
          </button>
        )}
      </div>
      {error && <p role="alert" className={`${avisoError} mt-3`}>{error}</p>}
    </div>
  )
}
