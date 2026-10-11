'use client'

import { useEffect, useState } from 'react'
import { DIAS_CHAT } from '@/lib/chat'
import Chat from './Chat'

// Boton redondo de cristal que acompaña a las noticias, a la izquierda de la barra de abajo.
// Al tocarlo se abre el chat encima, en una ventana de cristal, sin salir de la noticia.
// Lo muestra <Navegacion>, que es quien lo coloca en la pantalla.

export default function ChatFlotante() {
  const [abierto, setAbierto] = useState(false)
  // El chat se prepara la primera vez que se abre y despues se conserva (aunque se cierre),
  // para no perder lo que la persona estaba escribiendo. El color lo recuerda el navegador (sesion.ts).
  const [usado, setUsado] = useState(false)

  useEffect(() => {
    if (!abierto) return
    const cerrarConEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [abierto])

  function alternar() {
    setUsado(true)
    setAbierto(a => !a)
  }

  return (
    <div className="pointer-events-auto relative">
      {usado && (
        <section
          id="chat-flotante"
          aria-label="Chat"
          className={`cristal-denso fixed left-3 z-40 h-[min(36rem,calc(100dvh-8rem))] w-[min(23.5rem,calc(100vw-1.5rem))] origin-bottom-left flex-col overflow-hidden rounded-[2rem] bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] motion-safe:animate-[chat-abrir_180ms_ease-out] sm:absolute sm:bottom-full sm:left-0 sm:mb-3 ${abierto ? 'flex' : 'hidden'}`}
        >
          <header className="flex items-center justify-between gap-3 py-3 pr-3 pl-5">
            <div>
              <h2 className="text-[1.375rem] font-extrabold leading-tight tracking-[-0.02em]">Chat</h2>
              <p className="text-[0.8125rem] text-tinta-2">Anónimo. Los mensajes duran {DIAS_CHAT} días.</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar el chat"
              onClick={() => setAbierto(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-relleno text-tinta-2 transition hover:text-tinta active:scale-95"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          <Chat variante="flotante" activo={abierto} />
        </section>
      )}

      <button
        type="button"
        onClick={alternar}
        aria-label={abierto ? 'Cerrar el chat' : 'Abrir el chat'}
        aria-expanded={abierto}
        aria-controls="chat-flotante"
        title="Chat"
        className={`cristal cristal-barra flex h-14 w-14 items-center justify-center rounded-full transition active:scale-95 ${abierto ? 'text-acento-tinta' : 'text-tinta'}`}
      >
        {/* Dos globos de conversacion. */}
        <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9.5 4C5.9 4 3 6.4 3 9.4c0 1.6.8 3 2.1 4L4.4 16l2.9-1.4c.7.2 1.4.3 2.2.3 3.6 0 6.5-2.4 6.5-5.5S13.1 4 9.5 4z" />
          <path d="M18.2 10.6c1.7.9 2.8 2.4 2.8 4.1 0 1.3-.6 2.4-1.6 3.3l.5 2.2-2.4-1.1c-.6.1-1.2.2-1.8.2-2.1 0-3.9-.9-4.9-2.3" />
        </svg>
      </button>
    </div>
  )
}
