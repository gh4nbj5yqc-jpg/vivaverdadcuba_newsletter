'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SECCIONES, urlSeccion, type Seccion } from '@/lib/secciones'

// Pestañas de /noticias: General, Louisville, Miami y Houston. Cristal como la barra de abajo,
// pero bajita, para no quitar sitio a las noticias. Se queda pegada arriba al bajar.
// La burbuja sale hacia la pestaña tocada al momento, sin esperar a que cargue la seccion.
// "soloVista": en la vista previa del panel se dibuja igual, pero no navega.
export default function PestanasNoticias({ activa, soloVista = false }: { activa: Seccion; soloVista?: boolean }) {
  const [tocada, setTocada] = useState<{ seccion: Seccion; desde: Seccion } | null>(null)
  const elegida = tocada && tocada.desde === activa ? tocada.seccion : activa
  const indice = Math.max(SECCIONES.findIndex(s => s.id === elegida), 0)

  const clase = (s: Seccion) =>
    `relative flex min-h-8 items-center justify-center rounded-full px-1 text-[0.8125rem] font-semibold transition-colors duration-300 ${
      elegida === s ? 'text-acento-tinta' : 'text-tinta'
    }`

  return (
    <nav
      aria-label="Secciones de noticias"
      className="cristal cristal-barra sticky top-[calc(0.5rem+env(safe-area-inset-top,0px))] z-30 grid grid-cols-4 rounded-full p-1"
    >
      <span
        aria-hidden="true"
        style={{ translate: `${indice * 100}% 0` }}
        className="burbuja-barra absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full transition-[translate] duration-[480ms] ease-[cubic-bezier(0.3,1.4,0.5,1)] motion-reduce:transition-none"
      />
      {SECCIONES.map(s =>
        soloVista ? (
          <span key={s.id} aria-current={elegida === s.id ? 'page' : undefined} className={clase(s.id)}>
            {s.nombre}
          </span>
        ) : (
          <Link
            key={s.id}
            href={urlSeccion(s.id)}
            aria-current={elegida === s.id ? 'page' : undefined}
            onClick={() => setTocada({ seccion: s.id, desde: activa })}
            className={`${clase(s.id)} active:scale-95`}
          >
            {s.nombre}
          </Link>
        )
      )}
    </nav>
  )
}
