'use client'

import { useEffect, useRef } from 'react'

// La ventanita de cristal con los pasos para instalar la app en el iPhone o el iPad, con una
// flecha que señala donde esta el boton de Compartir de Safari. Apple no deja instalar con un
// boton, asi que es lo unico que se puede hacer. La usan <BotonInstalar> y <BotonNotificaciones>
// (en el iPhone, las notificaciones solo funcionan con la app instalada).

declare global {
  interface Navigator {
    // Solo existe en Safari del iPhone: true si la web se abrio desde la pantalla de inicio.
    standalone?: boolean
  }
}

// La web se esta usando como app: abierta desde la pantalla de inicio, sin la barra del navegador.
export function enLaApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true
  )
}

function esIPad() {
  const ua = navigator.userAgent
  // El iPad dice ser un Mac, pero los Mac no tienen pantalla tactil.
  return /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export function esIOS() {
  return /iPhone|iPod/.test(navigator.userAgent) || esIPad()
}

// Donde esta el boton de Compartir, segun el navegador:
// - Safari 26 o mas nuevo en iPhone: dentro del boton "···", abajo a la derecha.
// - Safari mas antiguo en iPhone: en la barra de abajo, en el centro.
// - Safari en iPad y Chrome en iPhone: arriba a la derecha.
export type Lugar = 'menu-abajo' | 'abajo' | 'arriba'

export function dondeCompartir(): Lugar {
  const ua = navigator.userAgent
  if (esIPad() || /CriOS/.test(ua)) return 'arriba'
  const version = Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0)
  return version >= 26 ? 'menu-abajo' : 'abajo'
}

export const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

// El icono de Compartir de Apple: un cuadro con una flecha hacia arriba.
function IconoCompartir() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="inline-block align-[-0.2em] text-[#007aff] dark:text-[#0a84ff]">
      <g {...trazo}>
        <path d="M12 3.5v11M8 7.2l4-3.7 4 3.7" />
        <path d="M8.5 10.5H7A1.5 1.5 0 0 0 5.5 12v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
      </g>
    </svg>
  )
}

export function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-relleno px-1.5 py-0.5 font-semibold text-tinta">{children}</span>
  )
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-acento text-[0.8125rem] font-bold text-white">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  )
}

type Props = {
  lugar: Lugar
  onCerrar: () => void
  titulo?: string
  intro?: React.ReactNode
  // Un ultimo paso despues de instalar (por ejemplo, activar las notificaciones desde la app).
  pasoFinal?: React.ReactNode
}

export default function VentanaInstalar({
  lugar,
  onCerrar,
  titulo = 'Instala Viva Verdad Cuba',
  intro = 'Tenla en tu pantalla de inicio, como una app.',
  pasoFinal,
}: Props) {
  const cerrar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cerrar.current?.focus()
    const conEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', conEscape)
    return () => window.removeEventListener('keydown', conEscape)
  }, [onCerrar])

  const arriba = lugar === 'arriba'
  const pasosCompartir = lugar === 'menu-abajo' ? 2 : 1

  // La flecha va dentro de la ventanita, en el borde que da a la barra de Safari: abajo al centro,
  // abajo a la derecha (el "···") o arriba a la derecha.
  const flecha = (
    <div aria-hidden="true" className={`flex ${lugar === 'abajo' ? 'justify-center' : 'justify-end'} ${arriba ? '-mt-1 mb-1' : 'mt-2 -mb-2'}`}>
      <svg
        viewBox="0 0 24 24"
        width="40"
        height="40"
        className={`text-acento ${
          arriba ? 'motion-safe:animate-[flecha-arriba_1.1s_ease-in-out_infinite]' : 'motion-safe:animate-[flecha-abajo_1.1s_ease-in-out_infinite]'
        }`}
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          d={arriba ? 'M12 20V5M5.5 11.5 12 5l6.5 6.5' : 'M12 4v15M5.5 12.5 12 19l6.5-6.5'}
        />
      </svg>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 text-base leading-normal font-normal tracking-normal" onClick={onCerrar}>
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="instalar-titulo"
        onClick={e => e.stopPropagation()}
        className={`absolute inset-x-3 max-w-sm motion-safe:animate-[chat-abrir_180ms_ease-out] ${
          arriba ? 'top-[calc(0.75rem+env(safe-area-inset-top,0px))]' : 'bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'
        } ${lugar === 'abajo' ? 'mx-auto' : 'ml-auto'}`}
      >
        {/* Cristal, pero mas opaco que el del chat: son instrucciones y tienen que leerse bien. */}
        <div className="cristal-denso rounded-[1.75rem] bg-superficie/90 px-5 pt-4 pb-5">
          {arriba && flecha}
          <div className="flex items-start justify-between gap-3">
            <h2 id="instalar-titulo" className="pt-1.5 text-[1.25rem] leading-tight font-extrabold tracking-[-0.02em]">
              {titulo}
            </h2>
            <button
              ref={cerrar}
              type="button"
              aria-label="Cerrar"
              onClick={onCerrar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-relleno text-tinta-2 transition hover:text-tinta active:scale-95"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[0.9375rem] text-tinta-2">{intro}</p>

          <ol className="mt-4 space-y-3 text-[1rem] leading-snug">
            {lugar === 'menu-abajo' ? (
              <>
                <Paso n={1}>
                  Toca el botón <Tecla>···</Tecla> de abajo a la derecha.
                </Paso>
                <Paso n={2}>
                  Toca <Tecla><IconoCompartir /> Compartir</Tecla>.
                </Paso>
              </>
            ) : (
              <Paso n={1}>
                Toca <Tecla><IconoCompartir /> Compartir</Tecla>{' '}
                {arriba ? 'arriba a la derecha.' : 'en la barra de abajo.'}
              </Paso>
            )}
            <Paso n={pasosCompartir + 1}>
              Toca <Tecla>Agregar a inicio</Tecla>. Si no lo ves, desliza hacia abajo o toca <Tecla>Ver más</Tecla>.
            </Paso>
            <Paso n={pasosCompartir + 2}>
              Toca <Tecla>Agregar</Tecla>.
            </Paso>
            {pasoFinal && <Paso n={pasosCompartir + 3}>{pasoFinal}</Paso>}
          </ol>
          {!arriba && flecha}
        </div>
      </div>
    </div>
  )
}
