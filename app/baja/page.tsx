import type { Metadata } from 'next'
import Link from 'next/link'
import { correoDeSuscriptor, enmascarar, leerEnlace } from '@/lib/baja'
import { NOMBRE_SITIO } from '@/lib/sitio'
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
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold sm:text-4xl">Enlace no válido</h1>
        <p className="mt-4 text-lg leading-relaxed text-[#1a1a1a]/75">
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
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold sm:text-4xl">Ya no estás suscrito</h1>
          <p className="mt-4 text-lg leading-relaxed text-[#1a1a1a]/75">
            Este correo ya no está en nuestra lista. No recibirás más envíos.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold sm:text-4xl">¿Darte de baja?</h1>
          {enlace.tipo === 'prueba' && (
            <p className="mx-auto mt-4 max-w-md border-l-4 border-[#b7791f] bg-[#b7791f]/10 px-4 py-3 text-left text-sm text-[#6b4a10]">
              Enlace de prueba (vista previa o correo de prueba): no da de baja a ningún suscriptor.
            </p>
          )}
          <p className="mt-4 text-lg leading-relaxed text-[#1a1a1a]/75">
            Dejarás de recibir los correos de {NOMBRE_SITIO} en
          </p>
          <p className="mt-2 break-all text-xl font-semibold">{correo}</p>
          <BotonBaja s={s} t={t} prueba={enlace.tipo === 'prueba'} />
        </>
      )
  }

  return (
    <main className="min-h-screen bg-[#fbf8f1] font-[family-name:var(--font-source-serif)] text-[#1a1a1a]">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <header className="pt-8 pb-5 text-center sm:pt-10">
          <Link href="/" className="font-[family-name:var(--font-playfair)] text-3xl font-black leading-none tracking-tight sm:text-5xl">
            {NOMBRE_SITIO}
          </Link>
          <div className="mt-5 border-t-[3px] border-b border-[#1a1a1a] pt-[3px]" />
        </header>

        <section className="border-t border-[#1a1a1a]/20 pt-10 pb-14 text-center">{contenido}</section>

        <footer className="border-t border-[#1a1a1a]/20 py-6 text-center text-sm">
          <Link href="/noticias" className="underline underline-offset-4 hover:text-[#8b1a1a]">
            Leer las noticias
          </Link>
        </footer>
      </div>
    </main>
  )
}
