'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import VentanaInstalar, { dondeCompartir, enLaApp, esIOS, Tecla, trazo, type Lugar } from '@/components/VentanaInstalar'
import { limpiarClave } from '@/lib/clave-vapid'

// Boton pequeño de cristal, "Activar notificaciones", que va en la cabecera junto a "Instalar app".
// - Al tocarlo pide permiso; si la persona acepta, su navegador queda guardado en Supabase
//   (/api/notificaciones) y recibe un aviso con cada noticia nueva.
// - Con las notificaciones activadas, el boton lo indica y, al tocarlo, deja desactivarlas.
// - En el iPhone solo funcionan con la app instalada: en Safari normal explica que primero hay
//   que instalarla, con los mismos pasos que "Instalar app".
// Los avisos los recibe y los abre public/sw.js. No sale en el panel de admin.

type Estado =
  | 'cargando' // todavia no se sabe (y en el servidor)
  | 'nada' // este navegador no puede recibir notificaciones
  | 'instalar-primero' // iPhone en Safari: hay que instalar la app
  | 'desactivadas'
  | 'activadas'
  | 'bloqueadas' // la persona las bloqueo en el navegador: solo se pueden activar desde los ajustes

// Limpia: si en Vercel se pego con un salto de linea o comillas, el navegador no la podria leer.
const CLAVE_PUBLICA = limpiarClave(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

function puedeRecibir() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// La clave publica VAPID viene en base64 "para URL"; el navegador la quiere en bytes.
function claveEnBytes(base64: string) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const binario = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binario, c => c.charCodeAt(0))
}

function mismaClave(a: ArrayBuffer | null, b: Uint8Array) {
  if (!a) return false
  const x = new Uint8Array(a)
  return x.length === b.length && x.every((v, i) => v === b[i])
}

function registrarServiceWorker() {
  return navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
}

// Texto corto del error para el mensaje detallado: "NotAllowedError: ...".
function describir(e: unknown) {
  if (e instanceof Error) return `${e.name}: ${e.message}`
  return String(e)
}

async function suscripcionActual() {
  const registro = await navigator.serviceWorker.getRegistration('/')
  return (await registro?.pushManager.getSubscription()) ?? null
}

function guardarEnServidor(suscripcion: PushSubscription) {
  return fetch('/api/notificaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(suscripcion.toJSON()),
  })
}

export default function BotonNotificaciones() {
  const ruta = usePathname() ?? '/'
  const [estado, setEstado] = useState<Estado>('cargando')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')
  // Que paso exactamente, para poder averiguar por que fallo en un telefono concreto.
  const [detalle, setDetalle] = useState('')
  // La ventanita abierta: los pasos para instalar (iPhone) o el globo de desactivar / bloqueadas.
  const [lugar, setLugar] = useState<Lugar | null>(null)
  const [globo, setGlobo] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const caja = useRef<HTMLDivElement>(null)
  // El service worker ya registrado al cargar la pagina (ver abajo, en activar()).
  const registro = useRef<ServiceWorkerRegistration | null>(null)

  // Al cargar, mira si este navegador ya tiene las notificaciones activadas.
  useEffect(() => {
    let vigente = true
    ;(async () => {
      let nuevo: Estado
      if (!CLAVE_PUBLICA) nuevo = 'nada'
      else if (!puedeRecibir()) nuevo = esIOS() && !enLaApp() ? 'instalar-primero' : 'nada'
      else if (Notification.permission === 'denied') nuevo = 'bloqueadas'
      else {
        const suscripcion = Notification.permission === 'granted' ? await suscripcionActual().catch(() => null) : null
        if (suscripcion && mismaClave(suscripcion.options.applicationServerKey, claveEnBytes(CLAVE_PUBLICA))) {
          // Se vuelve a guardar por si se borro en el servidor (no duplica: es la misma direccion).
          guardarEnServidor(suscripcion).catch(() => {})
          nuevo = 'activadas'
        } else {
          // Una suscripcion con otras claves ya no recibe nada: se quita para poder activarla de nuevo.
          if (suscripcion) await suscripcion.unsubscribe().catch(() => {})
          nuevo = 'desactivadas'
        }
      }
      if (vigente) setEstado(nuevo)
      // El service worker se deja listo desde ya: en el iPhone, Safari solo deja suscribirse justo
      // al tocar el boton, y si en ese momento hubiera que instalarlo primero, ya seria tarde.
      if (nuevo === 'desactivadas' || nuevo === 'activadas') {
        try {
          const r = await registrarServiceWorker()
          await navigator.serviceWorker.ready
          if (vigente) registro.current = r
        } catch {
          // Si falla aqui, activar() lo vuelve a intentar y, si sigue fallando, lo explica.
        }
      }
    })()
    return () => {
      vigente = false
    }
  }, [])

  // El globo se cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!globo) return
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setGlobo(false)
    }
    const conEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGlobo(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('pointerdown', fuera)
    window.addEventListener('keydown', conEscape)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      window.removeEventListener('keydown', conEscape)
    }
  }, [globo])

  const cerrarVentana = useCallback(() => {
    setLugar(null)
    boton.current?.focus()
  }, [])

  if (estado === 'cargando' || estado === 'nada' || ruta.startsWith('/admin')) return null

  async function activar() {
    setError('')
    setDetalle('')
    setTrabajando(true)
    // El paso en curso, para el mensaje de error detallado.
    let paso = 'preparar el servicio de avisos'
    try {
      const opciones = { userVisibleOnly: true, applicationServerKey: claveEnBytes(CLAVE_PUBLICA) }
      let suscripcion: PushSubscription
      const listo = registro.current
      if (listo?.active) {
        // Lo primero al tocar es suscribirse: el propio navegador pide permiso en ese momento.
        // (Safari del iPhone no lo deja si antes se espera a otra cosa.)
        paso = 'suscripción (permiso y servicio de avisos de Apple o Google)'
        suscripcion = await listo.pushManager.subscribe(opciones)
      } else {
        paso = 'registro del service worker'
        const r = await registrarServiceWorker()
        await navigator.serviceWorker.ready
        registro.current = r
        paso = 'suscripción (permiso y servicio de avisos de Apple o Google), con el service worker recién instalado'
        suscripcion = await r.pushManager.subscribe(opciones)
      }

      paso = 'guardar en el servidor'
      const res = await guardarEnServidor(suscripcion)
      if (!res.ok) {
        // Si no quedo guardada, no se deja a medias: el boton vuelve a ofrecer activarlas.
        const datos = await res.json().catch(() => ({}))
        await suscripcion.unsubscribe().catch(() => {})
        throw new Error(`HTTP ${res.status} ${datos.error ?? ''}`.trim())
      }
      setEstado('activadas')
    } catch (e) {
      // Si la persona dijo que no al permiso, no es un error: quedan bloqueadas.
      if ('Notification' in window && Notification.permission === 'denied') {
        setEstado('bloqueadas')
      } else {
        setError('No se pudieron activar las notificaciones. Inténtalo de nuevo.')
        setDetalle(`Falló en: ${paso}. ${describir(e)}`)
      }
      setGlobo(true)
    } finally {
      setTrabajando(false)
    }
  }

  async function desactivar() {
    setError('')
    setTrabajando(true)
    try {
      const suscripcion = await suscripcionActual()
      if (suscripcion) {
        // Primero en el navegador: asi deja de recibir avisos aunque falle la conexion.
        const { endpoint } = suscripcion
        await suscripcion.unsubscribe()
        await fetch('/api/notificaciones', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {})
      }
      setEstado('desactivadas')
      setGlobo(false)
      boton.current?.focus()
    } catch {
      setError('No se pudieron desactivar las notificaciones. Inténtalo de nuevo.')
    } finally {
      setTrabajando(false)
    }
  }

  function tocar() {
    if (estado === 'instalar-primero') setLugar(dondeCompartir())
    else if (estado === 'desactivadas') activar()
    else setGlobo(g => !g)
  }

  const activadas = estado === 'activadas'
  const conGlobo = activadas || estado === 'bloqueadas' || error !== ''

  return (
    <div ref={caja} className="relative flex">
      <button
        ref={boton}
        type="button"
        onClick={tocar}
        disabled={trabajando}
        aria-haspopup={estado === 'desactivadas' ? undefined : 'dialog'}
        aria-expanded={conGlobo ? globo : undefined}
        aria-label={activadas ? 'Notificaciones activadas. Toca para desactivarlas.' : undefined}
        className={`cristal border-linea inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full pr-3.5 pl-3 text-[0.8125rem] leading-none font-semibold tracking-normal transition active:scale-95 disabled:opacity-60 ${
          activadas ? 'text-acento-tinta' : 'text-tinta'
        }`}
      >
        {/* Una campana: llena con las notificaciones activadas, tachada si estan bloqueadas. */}
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <g {...trazo} fill={activadas ? 'currentColor' : 'none'}>
            <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z" />
            <path d="M10 20.5a2.2 2.2 0 0 0 4 0" fill="none" />
            {estado === 'bloqueadas' && <path d="M4 4l16 16" />}
          </g>
        </svg>
        {trabajando ? (
          'Un momento…'
        ) : activadas ? (
          'Notificaciones'
        ) : (
          <span>
            {/* En pantallas muy estrechas no cabe junto a "Instalar app": se queda en "Notificaciones". */}
            <span className="max-[379px]:hidden">Activar </span>
            <span className="max-[379px]:capitalize">notificaciones</span>
          </span>
        )}
      </button>

      {globo && conGlobo && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="cristal-denso absolute top-full right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[1.5rem] bg-superficie/90 p-4 text-[0.9375rem] leading-snug font-normal tracking-normal text-tinta motion-safe:animate-[chat-abrir_160ms_ease-out]"
        >
          {error ? (
            <div role="alert">
              <p>{error}</p>
              {detalle && <p className="mt-2 text-[0.8125rem] break-words text-tinta-2 select-text">{detalle}</p>}
            </div>
          ) : estado === 'bloqueadas' ? (
            <p>
              Las notificaciones están bloqueadas en este navegador. Para recibirlas, permítelas en los ajustes del
              navegador para vivaverdadcuba.com y vuelve a tocar el botón.
            </p>
          ) : (
            <>
              <p>Recibes un aviso cada vez que publicamos una noticia.</p>
              <button
                type="button"
                onClick={desactivar}
                disabled={trabajando}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-relleno px-4 font-semibold text-acento-tinta transition active:scale-[0.98] disabled:opacity-60"
              >
                {trabajando ? 'Desactivando…' : 'Desactivar notificaciones'}
              </button>
            </>
          )}
        </div>
      )}

      {lugar && (
        <VentanaInstalar
          lugar={lugar}
          onCerrar={cerrarVentana}
          titulo="Primero, instala la app"
          intro="En el iPhone, las notificaciones solo funcionan con Viva Verdad Cuba instalada en tu pantalla de inicio."
          pasoFinal={
            <>
              Abre la app desde tu pantalla de inicio y toca <Tecla>Activar notificaciones</Tecla>.
            </>
          }
        />
      )}
    </div>
  )
}
