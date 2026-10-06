import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { listarArticulos, formatearFecha, adelanto, portadaDe } from '@/lib/ediciones'
import { NOMBRE_SITIO } from '@/lib/sitio'

const descripcion =
  'Lee todas las noticias de Viva Verdad Cuba: lo que pasa en Cuba y el mundo, contado con verdad.'

export const metadata: Metadata = {
  title: `Noticias | ${NOMBRE_SITIO}`,
  description: descripcion,
  alternates: { canonical: '/noticias' },
  openGraph: {
    title: `Noticias | ${NOMBRE_SITIO}`,
    description: descripcion,
    url: '/noticias',
    siteName: NOMBRE_SITIO,
    locale: 'es_ES',
    type: 'website',
  },
}

export default async function NoticiasPage() {
  // Se genera en cada visita para que los articulos nuevos aparezcan al momento.
  await connection()
  const articulos = await listarArticulos()

  return (
    <main className="border-t border-[#1a1a1a]/20 pt-8 pb-12">
      <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold sm:text-4xl">
        Todas las noticias
      </h1>

      {articulos.length === 0 ? (
        <div className="mt-8 border-l-4 border-[#1a1a1a]/30 bg-white/60 px-5 py-6">
          <p className="text-lg leading-relaxed">
            Todavía no hemos publicado ninguna noticia. ¡Muy pronto tendrás aquí las primeras!
          </p>
          <Link href="/" className="mt-4 inline-block font-semibold underline underline-offset-4 hover:text-[#8b1a1a]">
            Suscríbete para recibirlas en tu correo →
          </Link>
        </div>
      ) : (
        <ul className="mt-6">
          {articulos.map(a => {
            const portada = portadaDe(a)
            return (
              <li key={a.id} className="border-b border-[#1a1a1a]/20 last:border-b-0">
                <Link href={`/noticias/${a.id}`} className="group block py-7">
                  <time dateTime={a.web_published_at} className="text-xs uppercase tracking-[0.18em] text-[#1a1a1a]/60">
                    {formatearFecha(a.web_published_at)}
                  </time>
                  <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-snug group-hover:text-[#8b1a1a] sm:text-3xl">
                    {a.web_title}
                  </h2>
                  {portada && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portada}
                      alt={`Imagen de la noticia: ${a.web_title}`}
                      loading="lazy"
                      className="mt-4 aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <p className="mt-3 text-lg leading-relaxed text-[#1a1a1a]/75">{adelanto(a)}</p>
                  <span className="mt-3 inline-block text-sm font-semibold uppercase tracking-[0.15em] group-hover:text-[#8b1a1a]">
                    Leer más →
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
