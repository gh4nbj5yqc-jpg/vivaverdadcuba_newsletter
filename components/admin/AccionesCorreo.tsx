'use client'

import { useState } from 'react'
import { pedirAdmin, pedirJson, SesionExpirada } from '@/lib/admin-cliente'
import { avisoError, avisoOk, botonPrimario, botonSecundario, campo, etiqueta, titular } from './estilos'

type Props = {
  bloqueado: boolean // el correo ya se envió: solo se puede ver la vista previa
  ocupado: boolean
  asunto: string
  // Guarda el correo y devuelve el id de la noticia (o null si no se pudo guardar).
  guardarPrimero: () => Promise<string | null>
  onEnviado: (sentAt: string) => void
}

type Vista = { html: string; bytes: number; errores: string[]; avisos: string[] }
type Aviso = { tipo: 'ok' | 'error'; texto: string } | null
type Accion = 'vista' | 'prueba' | 'contar' | 'enviar' | null

const LIMITE_KB = 90

function leerCorreoPrueba() {
  try { return localStorage.getItem('vvc-correo-prueba') ?? '' } catch { return '' }
}

export default function AccionesCorreo({ bloqueado, ocupado, asunto, guardarPrimero, onEnviado }: Props) {
  const [accion, setAccion] = useState<Accion>(null)
  const [vista, setVista] = useState<Vista | null>(null)
  const [ancho, setAncho] = useState<'movil' | 'ordenador'>('movil')
  const [correoPrueba, setCorreoPrueba] = useState(leerCorreoPrueba)
  const [aviso, setAviso] = useState<Aviso>(null)
  const [confirmar, setConfirmar] = useState<{ id: string; total: number } | null>(null)

  const trabajando = accion !== null || ocupado

  function error(e: unknown, porDefecto: string) {
    if (!(e instanceof SesionExpirada)) setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : porDefecto })
  }

  async function verPrevia() {
    setAviso(null)
    setAccion('vista')
    try {
      const id = await guardarPrimero()
      if (!id) return
      setVista(await pedirJson<Vista>(`/api/editions/${encodeURIComponent(id)}/correo`))
    } catch (e) {
      error(e, 'No se pudo generar la vista previa.')
    } finally {
      setAccion(null)
    }
  }

  async function enviarPrueba() {
    setAviso(null)
    const destino = correoPrueba.trim()
    if (!destino) {
      setAviso({ tipo: 'error', texto: 'Escribe el correo al que quieres enviar la prueba.' })
      return
    }
    try { localStorage.setItem('vvc-correo-prueba', destino) } catch { /* sin almacenamiento: no pasa nada */ }
    setAccion('prueba')
    try {
      const id = await guardarPrimero()
      if (!id) return
      await pedirJson(`/api/editions/${encodeURIComponent(id)}/prueba`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: destino }),
      })
      setAviso({ tipo: 'ok', texto: `Prueba enviada a ${destino}. Revisa tu bandeja (y la carpeta de spam).` })
    } catch (e) {
      error(e, 'No se pudo enviar la prueba.')
    } finally {
      setAccion(null)
    }
  }

  // Paso 1: guardar, comprobar el correo y pedir el número exacto de suscriptores.
  async function prepararEnvio() {
    setAviso(null)
    setConfirmar(null)
    setAccion('contar')
    try {
      const id = await guardarPrimero()
      if (!id) return
      const previa = await pedirJson<Vista>(`/api/editions/${encodeURIComponent(id)}/correo`)
      setVista(previa)
      if (previa.errores.length) {
        setAviso({ tipo: 'error', texto: 'Corrige esto antes de enviar: ' + previa.errores.join(' ') })
        return
      }
      const { suscriptores } = await pedirJson<{ suscriptores: number }>(`/api/editions/${encodeURIComponent(id)}/envio`)
      if (suscriptores === 0) {
        setAviso({ tipo: 'error', texto: 'No hay suscriptores a quien enviar.' })
        return
      }
      setConfirmar({ id, total: suscriptores })
    } catch (e) {
      error(e, 'No se pudo preparar el envío.')
    } finally {
      setAccion(null)
    }
  }

  // Paso 2: tras la confirmación, enviar por lotes.
  async function enviarATodos() {
    if (!confirmar) return
    const { id, total } = confirmar
    setConfirmar(null)
    setAviso(null)
    setAccion('enviar')
    try {
      const res = await pedirAdmin(`/api/editions/${encodeURIComponent(id)}/envio`, {
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
            `¡Enviado! Resend aceptó ${datos.enviados} correos en ${datos.lotes} ${datos.lotes === 1 ? 'lote' : 'lotes'}.` +
            (datos.marcada ? '' : ' Atención: no se pudo marcar la noticia como enviada en la base de datos; no la vuelvas a enviar.'),
        })
      } else {
        setAviso({ tipo: 'error', texto: datos.error || 'El envío falló. No se marcó como enviado.' })
      }
    } catch (e) {
      error(e, 'Se perdió la conexión durante el envío. Revisa en Resend qué correos salieron antes de reintentar.')
    } finally {
      setAccion(null)
    }
  }

  const pesoKb = vista ? Math.round(vista.bytes / 1024) : 0

  return (
    <div className="mt-8 border-t-[3px] border-double border-[#1a1a1a] pt-6">
      <h2 className={`${titular} text-2xl font-bold`}>Revisar y enviar</h2>
      <p className="mt-1 text-sm text-[#1a1a1a]/70">
        {bloqueado
          ? 'Puedes ver cómo quedó el correo que se envió.'
          : 'Cada botón guarda primero el correo; la vista previa y los envíos usan exactamente lo guardado.'}
      </p>

      <button type="button" className={`${botonSecundario} mt-4 w-full sm:w-auto`} disabled={trabajando} onClick={verPrevia}>
        {accion === 'vista' ? 'Preparando…' : 'Vista previa'}
      </button>

      {!bloqueado && (
        <>
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

          <button type="button" className={`${botonPrimario} mt-6 w-full`} disabled={trabajando || confirmar !== null} onClick={prepararEnvio}>
            {accion === 'contar' ? 'Comprobando…' : accion === 'enviar' ? 'Enviando a suscriptores… no cierres esta página' : 'Enviar a suscriptores'}
          </button>
        </>
      )}

      {confirmar && (
        <div role="alertdialog" aria-labelledby="confirmar-envio" className="mt-4 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-4 text-[#6b1414]">
          <p id="confirmar-envio" className="font-semibold">
            ¿Enviar «{asunto || 'sin asunto'}» a {confirmar.total} {confirmar.total === 1 ? 'suscriptor' : 'suscriptores'}?
          </p>
          <p className="mt-2">Una vez enviado no se puede deshacer ni modificar.</p>
          <div className="mt-4 grid gap-2 sm:flex">
            <button type="button" className="min-h-12 bg-[#8b1a1a] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#6b1414]"
              onClick={enviarATodos}>
              Sí, enviar a {confirmar.total}
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
              Peso: <strong className={pesoKb > LIMITE_KB ? 'text-[#8b1a1a]' : ''}>{pesoKb} KB</strong>
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
