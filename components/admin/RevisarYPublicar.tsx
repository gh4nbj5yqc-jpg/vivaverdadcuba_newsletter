'use client'

import { useState } from 'react'
import { pedirAdmin, pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import type { EstadoWeb } from '@/lib/noticias-admin'
import type { ResultadoGuardar } from './EditorNoticia'
import { avisoError, avisoOk, botonPrimario, botonSecundario, campo, etiqueta, titular as fuenteTitular } from './estilos'

// Parte final del editor: ver como queda el correo, enviarse una prueba y publicar
// la noticia en la web, por correo o en los dos sitios a la vez.

type Props = {
  id: string | null // null si la noticia todavia no se ha guardado nunca
  enviado: boolean // el correo ya se envió a los suscriptores
  publicada: boolean // la noticia ya está en la web
  ocupado: boolean
  titular: string
  // Guarda la noticia con el estado web indicado.
  guardar: (estado: EstadoWeb) => Promise<ResultadoGuardar>
  onEnviado: (sentAt: string) => void
}

type Vista = { html: string; bytes: number; errores: string[]; avisos: string[] }
type Aviso = { tipo: 'ok' | 'error'; texto: string } | null
type Accion = 'vista' | 'prueba' | 'web' | 'comprobar' | 'enviar' | null
// A donde va el envio en curso: solo al correo, o a la web y al correo.
type Destino = 'correo' | 'ambos'

const LIMITE_KB = 90

function leerCorreoPrueba() {
  try { return localStorage.getItem('vvc-correo-prueba') ?? '' } catch { return '' }
}

export default function RevisarYPublicar({ id, enviado, publicada, ocupado, titular, guardar, onEnviado }: Props) {
  const [accion, setAccion] = useState<Accion>(null)
  const [destino, setDestino] = useState<Destino>('correo')
  const [vista, setVista] = useState<Vista | null>(null)
  const [ancho, setAncho] = useState<'movil' | 'ordenador'>('movil')
  const [correoPrueba, setCorreoPrueba] = useState(leerCorreoPrueba)
  const [aviso, setAviso] = useState<Aviso>(null)
  const [confirmar, setConfirmar] = useState<{ id: string; total: number; destino: Destino } | null>(null)

  const trabajando = accion !== null || ocupado

  function error(e: unknown, porDefecto: string) {
    if (!(e instanceof SesionExpirada)) setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : porDefecto })
  }

  // Antes de la vista previa o de cualquier envío se guarda SIEMPRE la noticia, sin cambiar
  // si está o no en la web. Devuelve su id, o null si no se pudo guardar.
  async function guardarPrimero(): Promise<string | null> {
    // Un correo ya enviado no cambia: se puede ver sin guardar nada.
    if (enviado) return id
    const r = await guardar(publicada ? 'publicada' : 'borrador')
    if (r.ok) return r.id
    if (r.error) setAviso({ tipo: 'error', texto: r.error })
    return null
  }

  async function verPrevia() {
    setAviso(null)
    setAccion('vista')
    try {
      const idNoticia = await guardarPrimero()
      if (!idNoticia) return
      setVista(await pedirJson<Vista>(`/api/editions/${encodeURIComponent(idNoticia)}/correo`))
    } catch (e) {
      error(e, 'No se pudo generar la vista previa.')
    } finally {
      setAccion(null)
    }
  }

  async function enviarPrueba() {
    setAviso(null)
    const para = correoPrueba.trim()
    if (!para) {
      setAviso({ tipo: 'error', texto: 'Escribe el correo al que quieres enviar la prueba.' })
      return
    }
    try { localStorage.setItem('vvc-correo-prueba', para) } catch { /* sin almacenamiento: no pasa nada */ }
    setAccion('prueba')
    try {
      const idNoticia = await guardarPrimero()
      if (!idNoticia) return
      await pedirJson(`/api/editions/${encodeURIComponent(idNoticia)}/prueba`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: para }),
      })
      setAviso({ tipo: 'ok', texto: `Prueba enviada a ${para}. Revisa tu bandeja (y la carpeta de spam).` })
    } catch (e) {
      error(e, 'No se pudo enviar la prueba.')
    } finally {
      setAccion(null)
    }
  }

  // Publicar solo en la web: guarda la noticia como publicada. No envía ningún correo.
  async function publicarEnWeb() {
    setAviso(null)
    setConfirmar(null)
    setAccion('web')
    try {
      const r = await guardar('publicada')
      if (r.ok) setAviso({ tipo: 'ok', texto: '¡Publicada en la web! Ya se puede leer en /noticias.' })
      else if (r.error) setAviso({ tipo: 'error', texto: r.error })
    } finally {
      setAccion(null)
    }
  }

  // Envío por correo, paso 1: guardar, comprobar el correo y pedir el número exacto de suscriptores.
  async function prepararEnvio(a: Destino) {
    setAviso(null)
    setConfirmar(null)
    setDestino(a)
    setAccion('comprobar')
    try {
      const idNoticia = await guardarPrimero()
      if (!idNoticia) return
      const previa = await pedirJson<Vista>(`/api/editions/${encodeURIComponent(idNoticia)}/correo`)
      setVista(previa)
      if (previa.errores.length) {
        setAviso({ tipo: 'error', texto: 'Corrige esto antes de enviar: ' + previa.errores.join(' ') })
        return
      }
      const { suscriptores } = await pedirJson<{ suscriptores: number }>(`/api/editions/${encodeURIComponent(idNoticia)}/envio`)
      if (suscriptores === 0) {
        setAviso({ tipo: 'error', texto: 'No hay suscriptores a quien enviar.' })
        return
      }
      setConfirmar({ id: idNoticia, total: suscriptores, destino: a })
    } catch (e) {
      error(e, 'No se pudo preparar el envío.')
    } finally {
      setAccion(null)
    }
  }

  // Paso 2: tras la confirmación, publicar en la web (si se eligió «ambos») y enviar por lotes.
  async function enviarATodos() {
    if (!confirmar) return
    const { id: idNoticia, total, destino: a } = confirmar
    const ambos = a === 'ambos'
    setConfirmar(null)
    setAviso(null)
    setAccion('enviar')
    try {
      if (ambos) {
        const r = await guardar('publicada')
        if (!r.ok) {
          if (r.error) setAviso({ tipo: 'error', texto: `No se publicó en la web ni se envió ningún correo: ${r.error}` })
          return
        }
      }
      const res = await pedirAdmin(`/api/editions/${encodeURIComponent(idNoticia)}/envio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmados: total }),
      })
      const datos = await res.json().catch(() => ({}))
      if (res.ok && datos.ok) {
        onEnviado(new Date().toISOString())
        setAviso({
          tipo: 'ok',
          texto:
            (ambos ? '¡Publicada en la web y enviada por correo! ' : '¡Correo enviado! ') +
            `Resend aceptó ${datos.enviados} correos en ${datos.lotes} ${datos.lotes === 1 ? 'lote' : 'lotes'}.` +
            (datos.marcada ? '' : ' Atención: no se pudo marcar la noticia como enviada en la base de datos; no la vuelvas a enviar.'),
        })
      } else {
        setAviso({
          tipo: 'error',
          texto:
            (ambos ? 'La noticia sí quedó publicada en la web, pero el correo falló. ' : '') +
            (datos.error || 'El envío falló. No se marcó como enviado.'),
        })
      }
    } catch (e) {
      error(
        e,
        (ambos ? 'La noticia sí quedó publicada en la web. ' : '') +
          'Se perdió la conexión durante el envío. Revisa en Resend qué correos salieron antes de reintentar.'
      )
    } finally {
      setAccion(null)
    }
  }

  const pesoKb = vista ? Math.round(vista.bytes / 1024) : 0
  const bloquearEnvio = trabajando || confirmar !== null

  // Texto del botón de envío mientras trabaja.
  const rotulo = (a: Destino, normal: string) =>
    destino !== a ? normal
      : accion === 'comprobar' ? 'Comprobando…'
      : accion === 'enviar' ? 'Enviando… no cierres esta página'
      : normal

  return (
    <div className="mt-8 border-t-[3px] border-double border-[#1a1a1a] pt-6">
      <h2 className={`${fuenteTitular} text-2xl font-bold`}>Revisar y enviar</h2>
      <p className="mt-1 text-sm text-[#1a1a1a]/70">
        {enviado
          ? 'Puedes ver cómo quedó el correo que se envió.'
          : 'Cada botón guarda primero la noticia; la vista previa y los envíos usan exactamente lo guardado.'}
        {!enviado && publicada ? ' Como ya está publicada, lo guardado se ve en la web al momento.' : ''}
      </p>

      <button type="button" className={`${botonSecundario} mt-4 w-full sm:w-auto`} disabled={trabajando} onClick={verPrevia}>
        {accion === 'vista' ? 'Preparando…' : 'Vista previa'}
      </button>

      {!enviado && (
        <div className="mt-6">
          <label className={etiqueta} htmlFor="correo-prueba">Enviarme una prueba a</label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input id="correo-prueba" type="email" inputMode="email" autoComplete="email" className={campo}
              placeholder="tu@correo.com" value={correoPrueba} onChange={e => setCorreoPrueba(e.target.value)} />
            <button type="button" className={botonSecundario} disabled={trabajando} onClick={enviarPrueba}>
              {accion === 'prueba' ? 'Enviando…' : 'Enviarme una prueba'}
            </button>
          </div>
        </div>
      )}

      <h3 className={`${etiqueta} mt-8`}>Publicar</h3>
      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" className={botonSecundario} disabled={bloquearEnvio || publicada} onClick={publicarEnWeb}>
          {publicada ? '✓ Ya está en la web' : accion === 'web' ? 'Publicando…' : 'Publicar en la web'}
        </button>
        <button type="button" className={botonSecundario} disabled={bloquearEnvio || enviado} onClick={() => prepararEnvio('correo')}>
          {enviado ? '✓ Correo enviado' : rotulo('correo', 'Publicar al correo')}
        </button>
        <button type="button" className={botonPrimario} disabled={bloquearEnvio || publicada || enviado} onClick={() => prepararEnvio('ambos')}>
          {rotulo('ambos', 'Publicar en ambos')}
        </button>
      </div>
      <p className="mt-2 text-sm text-[#1a1a1a]/60">
        {publicada && enviado
          ? 'Esta noticia ya está en la web y su correo ya se envió.'
          : publicada
            ? 'Ya está en la web: solo falta enviarla por correo, si quieres.'
            : enviado
              ? 'El correo ya se envió: solo falta publicarla en la web, si quieres.'
              : 'Antes de enviar correos se te pedirá confirmación.'}
      </p>

      {confirmar && (
        <div role="alertdialog" aria-labelledby="confirmar-envio" className="mt-4 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-4 text-[#6b1414]">
          <p id="confirmar-envio" className="font-semibold">
            {confirmar.destino === 'ambos' ? '¿Publicar' : '¿Enviar'} «{titular || 'sin titular'}»
            {confirmar.destino === 'ambos' ? ' en la web y enviarla por correo' : ' por correo'} a {confirmar.total}{' '}
            {confirmar.total === 1 ? 'suscriptor' : 'suscriptores'}?
          </p>
          <p className="mt-2">
            El correo, una vez enviado, no se puede deshacer ni modificar.
            {confirmar.destino === 'ambos' ? ' La noticia en la web sí podrás corregirla o retirarla después.' : ''}
          </p>
          <div className="mt-4 grid gap-2 sm:flex">
            <button type="button" className="min-h-12 bg-[#8b1a1a] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#6b1414]"
              onClick={enviarATodos}>
              {confirmar.destino === 'ambos' ? `Sí, publicar y enviar a ${confirmar.total}` : `Sí, enviar a ${confirmar.total}`}
            </button>
            <button type="button" className="min-h-12 border border-[#1a1a1a]/40 bg-white px-5 text-sm font-semibold text-[#1a1a1a]"
              onClick={() => setConfirmar(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {aviso && (
        <p role={aviso.tipo === 'ok' ? 'status' : 'alert'} className={`${aviso.tipo === 'ok' ? avisoOk : avisoError} mt-4`}>
          {aviso.texto}
        </p>
      )}

      {vista && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[#1a1a1a]/70">
              Así llega el correo · Peso: <strong className={pesoKb > LIMITE_KB ? 'text-[#8b1a1a]' : ''}>{pesoKb} KB</strong>
            </p>
            <div className="flex gap-1" role="group" aria-label="Ancho de la vista previa">
              {(['movil', 'ordenador'] as const).map(a => (
                <button key={a} type="button" onClick={() => setAncho(a)} aria-pressed={ancho === a}
                  className={`min-h-11 border px-3 text-sm ${ancho === a ? 'border-[#1a1a1a] bg-[#1a1a1a] text-[#fbf8f1]' : 'border-[#1a1a1a]/30 bg-white'}`}>
                  {a === 'movil' ? 'Móvil' : 'Ordenador'}
                </button>
              ))}
            </div>
          </div>
          {[...vista.errores, ...vista.avisos].map(t => (
            <p key={t} className={`${vista.errores.includes(t) ? avisoError : 'border-l-4 border-[#b7791f] bg-[#b7791f]/10 px-4 py-3 text-[#6b4a10]'} mt-3 text-sm`}>{t}</p>
          ))}
          <div className="mt-3 overflow-x-auto border border-[#1a1a1a]/25 bg-[#efebe2]">
            <iframe
              title="Vista previa del correo"
              sandbox=""
              srcDoc={vista.html}
              className="mx-auto block h-[75vh] min-h-[480px] border-0 bg-white"
              style={{ width: ancho === 'movil' ? 375 : 640, maxWidth: ancho === 'movil' ? '100%' : undefined }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
