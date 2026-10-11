import type { Metadata } from 'next'
import { correoDeSuscriptor, enmascarar, leerEnlace } from '@/lib/baja'
import { NOMBRE_SITIO } from '@/lib/sitio'
import MarcoDiario from '@/components/MarcoDiario'
import BotonBaja from './BotonBaja'

export const metadata: Metadata = {
  title: `Darme de baja | ${NOMBRE_SITIO}`,
  robots: { index: false, follow: false },
  // El enlace lleva la firma: no la mandamos a otros sitios en la cabecera Referer.
  referrer: 'no-referrer',
}

type Props = { searchParams: Promise<{ [clave: string]: string | string[] | undefined }> }

const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '')

export default async function BajaPage({ searchParams }: Props) {
  const p = await searchParams
  const s = texto(p.s)
  const t = texto(p.t)
  const enlace = leerEnlace(s, t)

  // Abrir la pagina solo MUESTRA el correo: la baja se hace al pulsar el boton.
  let contenido: React.ReactNode
  if (enlace.tipo === 'invalido') {
    contenido = (
      <>
        <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-4xl">Enlace no válido</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-tinta-2">
          Este enlace de baja está incompleto o no es correcto. Usa el enlace «Darme de baja» que aparece al final de
          cualquiera de nuestros correos.
        </p>
      </>
    )
  } else {
    let correo: string | null = 'tu•••@correo.com'
    if (enlace.tipo === 'valido') {
      try {
        const real = await correoDeSuscriptor(enlace.id)
        correo = real ? enmascarar(real) : null
      } catch {
        correo = '•••'
      }
    }

    contenido =
      correo === null ? (
        <>
          <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-4xl">Ya no estás suscrito</h1>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-tinta-2">
            Este correo ya no está en nuestra lista. No recibirás más envíos.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] sm:text-4xl">¿Darte de baja?</h1>
          {enlace.tipo === 'prueba' && (
            <p className="mx-auto mt-4 max-w-md rounded-2xl bg-[#ff9f0a]/20 px-4 py-3 text-left text-[0.9375rem] leading-snug">
              Enlace de prueba (vista previa o correo de prueba): no da de baja a ningún suscriptor.
            </p>
          )}
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-tinta-2">
            Dejarás de recibir los correos de {NOMBRE_SITIO} en
          </p>
          <p className="mt-2 break-all text-xl font-semibold">{correo}</p>
          <BotonBaja s={s} t={t} prueba={enlace.tipo === 'prueba'} />
        </>
      )
  }

  return (
    <MarcoDiario>
      <main className="pt-7 pb-10">
        <section className="tarjeta px-5 py-10 text-center sm:px-8">{contenido}</section>
      </main>
    </MarcoDiario>
  )
}
