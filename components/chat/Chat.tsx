'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  colorLibre,
  contarPalabras,
  DIAS_CHAT,
  errorDeTexto,
  limpiarTexto,
  MAX_PALABRAS,
  MAX_SEGUIDOS,
  numeroDe,
  type MensajeChat,
} from '@/lib/chat'
import Bolita from './Bolita'
import { guardarSesion, leerSesion, type SesionChat } from './sesion'

// Chat abierto y anonimo. Cada visita recibe un codigo al azar que el navegador recuerda mientras
// la persona sigue en la web (ver sesion.ts): asi conserva su color aunque cambie de noticia,
// vuelva atras o pase del globo a la pagina /chat. Al cerrar la pestaña se pierde, y la proxima
// vez hay un codigo y un color nuevos.
//
// Se usa en dos sitios:
//   - "pagina":   la pagina /chat, a todo lo ancho.
//   - "flotante": dentro del globo que acompaña a las noticias (mas compacto).

type Props = {
  variante: 'pagina' | 'flotante'
  // false = el chat esta guardado (globo cerrado): no pide mensajes nuevos.
  activo?: boolean
}

// Cada cuanto se piden los mensajes nuevos.
const CADA_MS = 5000

const sinSuscripcion = () => () => {}

// Codigo al azar de esta visita. Los telefonos antiguos no tienen randomUUID: se arma a mano.
function codigoAlAzar() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('')
}

// La sesion de chat de esta pestaña: la que ya habia o, si no hay, una nueva.
function sesionDeLaPestana(): SesionChat {
  const enNavegador = typeof window !== 'undefined'
  const guardada = enNavegador ? leerSesion() : null
  if (guardada) return guardada
  const nueva: SesionChat = { codigo: codigoAlAzar(), color: null, mios: [] }
  if (enNavegador) guardarSesion(nueva)
  return nueva
}

function hora(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Chat({ variante, activo = true }: Props) {
  const flotante = variante === 'flotante'
  // true solo en el navegador (despues de cargar): evita pintar el color antes de tiempo.
  const enNavegador = useSyncExternalStore(sinSuscripcion, () => true, () => false)
  const [sesion] = useState(sesionDeLaPestana)
  const codigo = sesion.codigo

  const [mensajes, setMensajes] = useState<MensajeChat[] | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  // Mensajes propios recien enviados que todavia no llegan en la lista del servidor.
  const [recienEnviados, setRecienEnviados] = useState<{ mensaje: MensajeChat; enviadoEl: number }[]>([])
  const [mios, setMios] = useState<Set<string>>(() => new Set(sesion.mios))
  // El color definitivo lo confirma el servidor con el primer mensaje.
  const [colorConfirmado, setColorConfirmado] = useState<string | null>(sesion.color)

  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const caja = useRef<HTMLDivElement>(null)
  const pegadoAbajo = useRef(true)

  useEffect(() => {
    if (!activo) return
    let vivo = true
    async function cargar() {
      if (document.hidden) return
      try {
        const res = await fetch('/api/chat')
        if (!res.ok) throw new Error('sin respuesta')
        const datos = (await res.json()) as { mensajes: MensajeChat[] }
        if (!vivo) return
        setMensajes(datos.mensajes)
        setErrorCarga(false)
        // Un mensaje propio deja de estar "recien enviado" cuando ya viene del servidor, o a los 30 s.
        const llegados = new Set(datos.mensajes.map(m => m.id))
        setRecienEnviados(prev => prev.filter(r => !llegados.has(r.mensaje.id) && Date.now() - r.enviadoEl < 30_000))
      } catch {
        if (vivo) setErrorCarga(true)
      }
    }
    cargar()
    const reloj = setInterval(cargar, CADA_MS)
    document.addEventListener('visibilitychange', cargar)
    return () => {
      vivo = false
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', cargar)
    }
  }, [activo])

  const visibles = useMemo(() => {
    const base = mensajes ?? []
    const ids = new Set(base.map(m => m.id))
    return [...base, ...recienEnviados.map(r => r.mensaje).filter(m => !ids.has(m.id))]
  }, [mensajes, recienEnviados])

  // Antes del primer mensaje se muestra un color que nadie esta usando en el chat.
  const miColor = useMemo(() => {
    if (colorConfirmado) return colorConfirmado
    return colorLibre(new Set(visibles.map(m => m.color)), numeroDe(codigo))
  }, [colorConfirmado, visibles, codigo])

  // Al llegar mensajes nuevos (o al abrir el globo) baja al final, salvo que la persona haya subido a leer.
  useEffect(() => {
    const el = caja.current
    if (el && activo && pegadoAbajo.current) el.scrollTop = el.scrollHeight
  }, [visibles.length, activo])

  const palabras = contarPalabras(texto)
  const pasado = palabras > MAX_PALABRAS
  const topeSeguidos = visibles.length >= MAX_SEGUIDOS && visibles.slice(-MAX_SEGUIDOS).every(m => mios.has(m.id))

  async function enviar() {
    if (enviando) return
    const limpio = limpiarTexto(texto)
    const problema = errorDeTexto(limpio)
    if (problema) {
      setError(problema)
      return
    }
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: limpio, codigo, color: miColor }),
      })
      const datos = await res.json().catch(() => ({}))
      if (!res.ok || !datos.mensaje) {
        setError(datos.error || 'No se pudo enviar. Inténtalo de nuevo.')
        return
      }
      const mensaje = datos.mensaje as MensajeChat
      pegadoAbajo.current = true
      const misMensajes = new Set(mios).add(mensaje.id)
      setColorConfirmado(mensaje.color)
      setMios(misMensajes)
      guardarSesion({ codigo, color: mensaje.color, mios: [...misMensajes] })
      setRecienEnviados(prev => [...prev, { mensaje, enviadoEl: Date.now() }])
      setTexto('')
    } catch {
      setError('No hay conexión. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  // Los nombres de los campos llevan la variante para que no choquen si hay dos chats en la pagina.
  const idCampo = `mensaje-${variante}`

  const lista = (
    <div
      ref={caja}
      role="log"
      aria-label="Mensajes del chat"
      tabIndex={0}
      onScroll={e => {
        const el = e.currentTarget
        pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      }}
      className={
        flotante
          ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3'
          : 'tarjeta mt-5 h-[max(16rem,calc(100dvh-33rem))] overflow-y-auto overscroll-contain px-4 py-4 sm:px-5'
      }
    >
      {mensajes === null ? (
        <p className="py-6 text-center text-[0.9375rem] text-tinta-2">
          {errorCarga ? 'No se pudo cargar el chat. Reintentando…' : 'Cargando el chat…'}
        </p>
      ) : visibles.length === 0 ? (
        <p className="py-6 text-center text-[0.9375rem] text-tinta-2">Todavía no hay mensajes. Escribe el primero.</p>
      ) : (
        <ul className="space-y-3">
          {visibles.map(m => {
            const mio = mios.has(m.id)
            return (
              // Los mensajes propios van a la derecha, en color; los de los demas, a la izquierda, en gris.
              <li key={m.id} className={`flex items-end gap-2 ${mio ? 'flex-row-reverse' : ''}`}>
                <Bolita color={m.color} className="mb-5" />
                <div className={`flex min-w-0 max-w-[82%] flex-col ${mio ? 'items-end' : 'items-start'}`}>
                  <p
                    className={`whitespace-pre-wrap break-words rounded-[1.25rem] px-3.5 py-2 leading-snug [overflow-wrap:anywhere] ${flotante ? 'text-base' : 'text-[1.0625rem]'} ${
                      mio
                        ? 'rounded-br-md bg-acento text-white'
                        : 'rounded-bl-md bg-relleno text-tinta'
                    }`}
                  >
                    {m.texto}
                  </p>
                  <p className="mt-1 px-1 text-xs text-tinta-2">
                    {mio ? 'Tú, ' : ''}
                    {hora(m.created_at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const formulario = (
    <form
      className={flotante ? 'px-3 pt-2 pb-3' : 'mt-4'}
      onSubmit={e => {
        e.preventDefault()
        enviar()
      }}
    >
      {mensajes !== null && errorCarga && <p className="mb-2 px-1 text-sm text-acento-tinta">Se perdió la conexión. Reintentando…</p>}
      <label htmlFor={idCampo} className="sr-only">Tu mensaje</label>
      {/* Caja de escribir: el campo y el boton redondo de enviar van dentro del mismo recuadro. */}
      <div className="flex items-end gap-2 rounded-[1.625rem] bg-superficie py-1.5 pr-1.5 pl-4 shadow-[inset_0_0_0_1px_var(--linea)] transition focus-within:shadow-[inset_0_0_0_2px_var(--acento)]">
        <textarea
          id={idCampo}
          rows={2}
          value={texto}
          maxLength={2000}
          placeholder="Escribe tu mensaje…"
          aria-describedby={`${idCampo}-ayuda`}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            // En el ordenador, Enter envia y Mayus+Enter hace salto de linea. En el telefono se usa el boton.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(pointer: fine)').matches) {
              e.preventDefault()
              enviar()
            }
          }}
          className="block min-w-0 flex-1 resize-none bg-transparent py-1.5 text-base leading-snug text-tinta placeholder:text-tinta-3 focus:outline-none"
        />
        <button
          type="submit"
          aria-label={enviando ? 'Enviando' : 'Enviar mensaje'}
          disabled={enviando || pasado || topeSeguidos || !texto.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-acento text-white transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-relleno disabled:text-tinta-3"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
          </svg>
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[0.8125rem] text-tinta-2">
        <p className="flex items-center gap-1.5">
          {enNavegador && <Bolita color={miColor} className="!h-3 !w-3" />}
          Tu color en este chat
        </p>
        <p id={`${idCampo}-ayuda`} className={pasado ? 'font-semibold text-acento-tinta' : ''}>
          {palabras} de {MAX_PALABRAS} palabras
        </p>
      </div>
      <div aria-live="polite" className="text-sm">
        {topeSeguidos && (
          <p className="mt-2 rounded-2xl bg-[#ff9f0a]/20 px-3.5 py-2.5 leading-snug">
            Ya escribiste {MAX_SEGUIDOS} mensajes seguidos. Cuando alguien más escriba podrás seguir.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 rounded-2xl bg-acento/15 px-3.5 py-2.5 leading-snug">
            {error}
          </p>
        )}
      </div>
    </form>
  )

  if (flotante) {
    return (
      <>
        {lista}
        {formulario}
      </>
    )
  }

  return (
    <main className="pt-7 pb-10">
      <h1 className="text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">Chat</h1>
      <p className="mt-2 text-[1.0625rem] leading-relaxed text-tinta-2">
        Un espacio abierto para opinar. No pedimos ni guardamos tu nombre ni tu correo: te distingue una bolita de color,
        que es tuya mientras sigas en la web. Los mensajes se borran a los {DIAS_CHAT} días.
      </p>
      {lista}
      {formulario}
    </main>
  )
}
