'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import VentanaInstalar, { dondeCompartir, enLaApp, esIOS, trazo, type Lugar } from '@/components/VentanaInstalar'

// Boton pequeño de cristal, "Instalar app", que va en la cabecera.
// - En Android y Chrome: abre directamente el aviso de instalar del navegador.
// - En iPhone y iPad: Apple no deja instalar con un boton, asi que abre una ventanita con los
//   pasos y una flecha que señala donde esta el boton de Compartir de Safari (<VentanaInstalar>).
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
}

type Modo = 'nada' | 'aviso' | 'iphone'

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

export default function BotonInstalar() {
  const ruta = usePathname() ?? '/'
  const modo = useSyncExternalStore(suscribir, modoActual, () => 'nada' as Modo)
  const [lugar, setLugar] = useState<Lugar | null>(null)
  const boton = useRef<HTMLButtonElement>(null)

  const cerrarVentana = useCallback(() => {
    setLugar(null)
    boton.current?.focus()
  }, [])

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

      {lugar && <VentanaInstalar lugar={lugar} onCerrar={cerrarVentana} />}
    </>
  )
}
