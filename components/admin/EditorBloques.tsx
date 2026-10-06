'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  bloqueImagen,
  bloqueTexto,
  contarImagenes,
  type Bloque,
  type BloqueImagen,
  type BloqueTexto,
  type Modo,
} from '@/lib/bloques'
import CampoImagen from './CampoImagen'
import { botonIcono, botonPeligro, botonSecundario, campo, etiqueta } from './estilos'

export type ArticuloPublicado = { id: string; titulo: string }

type Props = {
  bloques: Bloque[]
  setBloques: Dispatch<SetStateAction<Bloque[]>>
  modo: Modo
  maxImagenes: number
  articulos?: ArticuloPublicado[]
  deshabilitado?: boolean
}

// Editor de bloques (imagen / texto) usado en el correo y en la web.
// Sin arrastrar y soltar: flechas para mover, cómodo en el teléfono.
export default function EditorBloques({ bloques, setBloques, modo, maxImagenes, articulos = [], deshabilitado }: Props) {
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const imagenes = contarImagenes(bloques)
  const limiteImagenes = imagenes >= maxImagenes

  function cambiar(id: string, cambios: Partial<BloqueImagen> | Partial<BloqueTexto>) {
    setBloques(prev => prev.map(b => (b.id === id ? ({ ...b, ...cambios } as Bloque) : b)))
  }

  function mover(indice: number, paso: -1 | 1) {
    setBloques(prev => {
      const destino = indice + paso
      if (destino < 0 || destino >= prev.length) return prev
      const copia = [...prev]
      ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
      return copia
    })
  }

  function eliminar(id: string) {
    setBloques(prev => prev.filter(b => b.id !== id))
    setConfirmando(null)
  }

  return (
    <div>
      <ol className="space-y-4">
        {bloques.map((b, i) => (
          <li key={b.id} className="border border-[#1a1a1a]/25 bg-white/70">
            <div className="flex items-center justify-between gap-2 border-b border-[#1a1a1a]/15 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]/70">
                {i + 1}. {b.tipo === 'imagen' ? 'Imagen' : 'Texto'}
                {b.etiqueta && <span className="font-normal normal-case tracking-normal"> · {b.etiqueta}</span>}
              </p>
              <div className="flex gap-1">
                <button type="button" aria-label="Subir bloque" className={botonIcono} disabled={deshabilitado || i === 0} onClick={() => mover(i, -1)}>
                  ↑
                </button>
                <button type="button" aria-label="Bajar bloque" className={botonIcono} disabled={deshabilitado || i === bloques.length - 1} onClick={() => mover(i, 1)}>
                  ↓
                </button>
                <button type="button" aria-label="Eliminar bloque" className={`${botonIcono} text-[#8b1a1a]`} disabled={deshabilitado} onClick={() => setConfirmando(b.id)}>
                  ✕
                </button>
              </div>
            </div>

            {confirmando === b.id && (
              <div role="alertdialog" aria-label="Confirmar eliminación" className="flex flex-wrap items-center gap-2 border-b border-[#8b1a1a]/30 bg-[#8b1a1a]/10 px-3 py-3">
                <p className="mr-auto text-sm text-[#6b1414]">¿Eliminar este bloque?</p>
                <button type="button" className={botonPeligro} onClick={() => eliminar(b.id)}>Sí, eliminar</button>
                <button type="button" className="min-h-11 px-3 text-sm underline" onClick={() => setConfirmando(null)}>Cancelar</button>
              </div>
            )}

            <div className="space-y-3 p-3">
              {b.tipo === 'imagen' ? (
                <>
                  <CampoImagen url={b.url} onUrl={url => cambiar(b.id, { url })} deshabilitado={deshabilitado} />
                  <div>
                    <label className={etiqueta} htmlFor={`alt-${b.id}`}>Texto alternativo (opcional)</label>
                    <input id={`alt-${b.id}`} className={campo} value={b.alt} disabled={deshabilitado} maxLength={300}
                      placeholder="Describe la foto para quien no puede verla"
                      onChange={e => cambiar(b.id, { alt: e.target.value })} />
                  </div>
                  <div>
                    <label className={etiqueta} htmlFor={`pie-${b.id}`}>Pie de foto (opcional)</label>
                    <input id={`pie-${b.id}`} className={campo} value={b.pie} disabled={deshabilitado} maxLength={500}
                      onChange={e => cambiar(b.id, { pie: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={etiqueta} htmlFor={`sub-${b.id}`}>Subtítulo (opcional)</label>
                    <input id={`sub-${b.id}`} className={campo} value={b.subtitulo} disabled={deshabilitado} maxLength={200}
                      onChange={e => cambiar(b.id, { subtitulo: e.target.value })} />
                  </div>
                  <div>
                    <label className={etiqueta} htmlFor={`txt-${b.id}`}>Párrafos</label>
                    <textarea id={`txt-${b.id}`} className={`${campo} min-h-40 leading-relaxed`} value={b.texto} disabled={deshabilitado}
                      placeholder="Escribe aquí. Cada salto de línea empieza un párrafo nuevo."
                      onChange={e => cambiar(b.id, { texto: e.target.value })} />
                  </div>
                  {modo === 'correo' && (
                    <div>
                      <label className={etiqueta} htmlFor={`enl-${b.id}`}>Botón «Leer la noticia completa →»</label>
                      <select id={`enl-${b.id}`} className={campo} value={b.enlaceId ?? ''} disabled={deshabilitado}
                        onChange={e => cambiar(b.id, { enlaceId: e.target.value || null })}>
                        <option value="">Sin botón</option>
                        {articulos.map(a => (
                          <option key={a.id} value={a.id}>{a.titulo}</option>
                        ))}
                        {b.enlaceId && !articulos.some(a => a.id === b.enlaceId) && (
                          <option value={b.enlaceId}>(Artículo no publicado: elige otro)</option>
                        )}
                      </select>
                      {articulos.length === 0 && (
                        <p className="mt-1 text-sm text-[#1a1a1a]/60">Aún no hay artículos publicados en la web para enlazar.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      {bloques.length === 0 && (
        <p className="border border-dashed border-[#1a1a1a]/30 px-4 py-6 text-center text-[#1a1a1a]/60">
          No hay bloques. Añade una imagen o un texto.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className={botonSecundario} disabled={deshabilitado || limiteImagenes}
          onClick={() => setBloques(prev => [...prev, bloqueImagen()])}>
          + Imagen
        </button>
        <button type="button" className={botonSecundario} disabled={deshabilitado}
          onClick={() => setBloques(prev => [...prev, bloqueTexto()])}>
          + Texto
        </button>
      </div>
      <p className="mt-2 text-sm text-[#1a1a1a]/60">
        {imagenes} de {maxImagenes} imágenes{limiteImagenes ? ' · has llegado al máximo' : ''}
      </p>
    </div>
  )
}
