'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import ChatFlotante from '@/components/chat/ChatFlotante'

// Barra flotante de cristal, abajo en el centro, como la de las apps del iPhone.
// Vive en el marco general de la web (app/layout.tsx), asi que es siempre la misma barra
// al pasar de una seccion a otra: por eso la burbuja de la seccion elegida puede deslizarse.
// En las noticias lleva a su izquierda el boton del chat. En el panel de admin no sale.

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const SECCIONES = [
  {
    href: '/',
    nombre: 'Inicio',
    icono: <path {...trazo} d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H14.5v-5.5h-5v5.5H5.5A1.5 1.5 0 0 1 4 19z" />,
  },
  {
    href: '/noticias',
    nombre: 'Noticias',
    icono: (
      <g {...trazo}>
        <rect x="4" y="4.5" width="16" height="15" rx="3" />
        <path d="M8 9h8M8 12.5h8M8 16h4.5" />
      </g>
    ),
  },
  {
    href: '/chat',
    nombre: 'Chat',
    icono: <path {...trazo} d="M12 4.5c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-.9 0-1.8-.1-2.6-.3L5 20l1-3.5C4.4 15.2 3.5 13.5 3.5 11.5c0-3.9 3.8-7 8.5-7z" />,
  },
]

function seccionDe(ruta: string) {
  return SECCIONES.findIndex(s => (s.href === '/' ? ruta === '/' : ruta === s.href || ruta.startsWith(s.href + '/')))
}

export default function Navegacion() {
  const ruta = usePathname() ?? '/'
  // La seccion recien tocada: la burbuja sale hacia ella al momento, sin esperar a que cargue la pagina.
  // Solo vale mientras se sigue en la pagina desde la que se toco.
  const [tocada, setTocada] = useState<{ indice: number; desde: string } | null>(null)
  const activa = tocada && tocada.desde === ruta ? tocada.indice : seccionDe(ruta)

  const burbuja = useRef<HTMLSpanElement>(null)
  const anterior = useRef(activa)

  // Al cambiar de seccion, la burbuja se estira mientras viaja y se asienta al llegar, como una gota.
  useEffect(() => {
    const de = anterior.current
    anterior.current = activa
    const el = burbuja.current
    if (!el || de === activa || de === -1 || activa === -1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate(
      [
        { scale: '1 1', offset: 0 },
        { scale: '1.32 0.86', offset: 0.35 },
        { scale: '0.94 1.05', offset: 0.75 },
        { scale: '1 1', offset: 1 },
      ],
      { duration: 520, easing: 'ease-out' }
    )
  }, [activa])

  if (ruta.startsWith('/admin')) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <div className="relative flex items-center gap-2">
        {/* El boton del chat se cuelga a la izquierda de la barra sin empujarla: asi la barra no se mueve
            de sitio al entrar o salir de las noticias. (En pantallas muy estrechas no cabe y va al lado.) */}
        {ruta.startsWith('/noticias') && (
          <div className="flex items-center min-[360px]:absolute min-[360px]:inset-y-0 min-[360px]:right-full min-[360px]:mr-2">
            <ChatFlotante />
          </div>
        )}

        <nav aria-label="Secciones" className="cristal cristal-barra pointer-events-auto flex rounded-full p-1.5">
          {/* La burbuja que marca la seccion elegida. Es una sola y se desliza de una a otra. */}
          <span
            ref={burbuja}
            aria-hidden="true"
            style={{ translate: `${Math.max(activa, 0) * 100}% 0` }}
            className={`burbuja-barra absolute top-1.5 bottom-1.5 left-1.5 w-[4.25rem] rounded-full transition-[translate,opacity] duration-[480ms] ease-[cubic-bezier(0.3,1.4,0.5,1)] motion-reduce:transition-none ${
              activa === -1 ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {SECCIONES.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              aria-current={activa === i ? 'page' : undefined}
              onClick={() => setTocada({ indice: i, desde: ruta })}
              className={`relative flex w-[4.25rem] flex-col items-center gap-0.5 rounded-full py-1.5 text-[0.6875rem] font-semibold transition-colors duration-300 active:scale-95 ${
                activa === i ? 'text-acento-tinta' : 'text-tinta'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                {s.icono}
              </svg>
              {s.nombre}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
