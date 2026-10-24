'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Boton pequeño de cristal, "Instalar app", que va en la cabecera.
// - En Android y Chrome: abre directamente el aviso de instalar del navegador.
// - En iPhone y iPad: Apple no deja instalar con un boton, asi que abre una ventanita con los
//   pasos y una flecha que señala donde esta el boton de Compartir de Safari.
// No sale si la web ya se esta usando como app (abierta desde la pantalla de inicio) ni si Chrome
// sabe que ya esta instalada (en ese caso no ofrece el aviso). Tampoco en el panel de admin.
//
// El aviso de Chrome ("beforeinstallprompt") puede llegar antes de que cargue React, asi que lo
// guarda un script pequeño de app/layout.tsx en window.__avisoInstalar y avisa con "aviso-instalar".

interface AvisoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __avisoInstalar?: AvisoInstalar | null
    __appInstalada?: boolean
  }
  interface Navigator {
    // Solo existe en Safari del iPhone: true si la web se abrio desde la pantalla de inicio.
    standalone?: boolean
  }
}

type Modo = 'nada' | 'aviso' | 'iphone'

function enLaApp() {
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

function esIOS() {
  return /iPhone|iPod/.test(navigator.userAgent) || esIPad()
}

function modoActual(): Modo {
  if (enLaApp() || window.__appInstalada) return 'nada'
  if (window.__avisoInstalar) return 'aviso'
  if (esIOS()) return 'iphone'
  return 'nada'
}

function suscribir(cambio: () => void) {
  const pantalla = window.matchMedia('(display-mode: standalone)')
  window.addEventListener('aviso-instalar', cambio)
  pantalla.addEventListener('change', cambio)
  return () => {
    window.removeEventListener('aviso-instalar', cambio)
    pantalla.removeEventListener('change', cambio)
  }
}

// Donde esta el boton de Compartir, segun el navegador:
// - Safari 26 o mas nuevo en iPhone: dentro del boton "···", abajo a la derecha.
// - Safari mas antiguo en iPhone: en la barra de abajo, en el centro.
// - Safari en iPad y Chrome en iPhone: arriba a la derecha.
type Lugar = 'menu-abajo' | 'abajo' | 'arriba'

function dondeCompartir(): Lugar {
  const ua = navigator.userAgent
  if (esIPad() || /CriOS/.test(ua)) return 'arriba'
  const version = Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0)
  return version >= 26 ? 'menu-abajo' : 'abajo'
}

const trazo = {
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

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-relleno px-1.5 py-0.5 font-semibold text-tinta">{children}</span>
  )
}

export default function BotonInstalar() {
  const ruta = usePathname() ?? '/'
  const modo = useSyncExternalStore(suscribir, modoActual, () => 'nada' as Modo)
  const [lugar, setLugar] = useState<Lugar | null>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const cerrar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!lugar) return
    cerrar.current?.focus()
    const conEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLugar(null)
    }
    window.addEventListener('keydown', conEscape)
    return () => window.removeEventListener('keydown', conEscape)
  }, [lugar])

  if (modo === 'nada' || ruta.startsWith('/admin')) return null

  async function instalar() {
    if (modo === 'iphone') {
      setLugar(dondeCompartir())
      return
    }
    const aviso = window.__avisoInstalar
    if (!aviso) return
    // El aviso solo se puede usar una vez: si la persona dice que no, Chrome manda otro mas adelante.
    window.__avisoInstalar = null
    await aviso.prompt()
    window.dispatchEvent(new Event('aviso-instalar'))
  }

  function cerrarVentana() {
    setLugar(null)
    boton.current?.focus()
  }

  const arriba = lugar === 'arriba'

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
    <>
      <button
        ref={boton}
        type="button"
        onClick={instalar}
        aria-haspopup={modo === 'iphone' ? 'dialog' : undefined}
        className="cristal cristal-barra inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full pr-3.5 pl-3 text-[0.8125rem] leading-none font-semibold tracking-normal text-tinta transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <g {...trazo}>
            <path d="M12 4v10.5M7.8 10.5 12 14.7l4.2-4.2" />
            <path d="M4.5 15.5v2A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-2" />
          </g>
        </svg>
        Instalar app
      </button>

      {lugar && (
        <div className="fixed inset-0 z-50 text-base leading-normal font-normal tracking-normal" onClick={cerrarVentana}>
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
                  Instala Viva Verdad Cuba
                </h2>
                <button
                  ref={cerrar}
                  type="button"
                  aria-label="Cerrar"
                  onClick={cerrarVentana}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-relleno text-tinta-2 transition hover:text-tinta active:scale-95"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-[0.9375rem] text-tinta-2">Tenla en tu pantalla de inicio, como una app.</p>

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
                <Paso n={lugar === 'menu-abajo' ? 3 : 2}>
                  Toca <Tecla>Agregar a inicio</Tecla>. Si no lo ves, desliza hacia abajo o toca <Tecla>Ver más</Tecla>.
                </Paso>
                <Paso n={lugar === 'menu-abajo' ? 4 : 3}>
                  Toca <Tecla>Agregar</Tecla>.
                </Paso>
              </ol>
              {!arriba && flecha}
            </div>
          </div>
        </div>
      )}
    </>
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
