'use client'

import { useEffect, useState } from 'react'
import { DIAS_CHAT } from '@/lib/chat'
import Chat from './Chat'

// Globo del chat que acompaña a las noticias: un cuadradito con forma de mensaje, fijo en la
// esquina inferior izquierda de la pantalla. Al tocarlo se abre el chat encima, sin salir de la noticia.

export default function ChatFlotante() {
  const [abierto, setAbierto] = useState(false)
  // El chat se prepara la primera vez que se abre y despues se conserva (aunque se cierre el globo),
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
    <>
      {usado && (
        <section
          id="chat-flotante"
          aria-label="Chat"
          className={`fixed left-3 z-40 h-[min(36rem,calc(100dvh-7.5rem))] w-[min(23.5rem,calc(100vw-1.5rem))] origin-bottom-left flex-col overflow-hidden rounded-3xl bg-[#fbf8f1] shadow-[0_24px_60px_-12px_rgba(26,26,26,0.45),0_4px_14px_rgba(26,26,26,0.12)] ring-1 ring-[#1a1a1a]/10 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] motion-safe:animate-[chat-abrir_180ms_ease-out] sm:left-5 ${abierto ? 'flex' : 'hidden'}`}
        >
          <header className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/10 py-2.5 pr-2.5 pl-5">
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight">Chat</h2>
              <p className="text-xs text-[#1a1a1a]/55">Anónimo. Los mensajes duran {DIAS_CHAT} días.</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar el chat"
              onClick={() => setAbierto(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#1a1a1a]/70 transition hover:bg-[#1a1a1a]/8 hover:text-[#1a1a1a]"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
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
        className="fixed left-3 z-40 h-14 w-14 drop-shadow-[0_6px_10px_rgba(26,26,26,0.3)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b1a1a] bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:left-5"
      >
        {/* Cuadradito con forma de mensaje: recuadro con su piquito y renglones de texto, como una columna de periodico. */}
        <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
          <path d="M11 6h34a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H24L13 51V40h-2a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5z" fill="#1a1a1a" />
          <path d="M15 16h26M15 23h26M15 30h15" stroke="#fbf8f1" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      </button>
    </>
  )
}
