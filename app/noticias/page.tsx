import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import CuerpoNoticia from '@/components/noticias/CuerpoNoticia'
import { urlImagenPermitida } from '@/lib/bloques'
import { listarArticulos, formatearFecha } from '@/lib/ediciones'
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
    <main className="pt-7 pb-10">
      <h1 className="text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">Todas las noticias</h1>

      {articulos.length === 0 ? (
        <div className="tarjeta mt-4 px-5 py-6 sm:px-8">
          <p className="text-lg leading-relaxed">
            Todavía no hemos publicado ninguna noticia. Muy pronto tendrás aquí las primeras.
          </p>
          <Link href="/" className="boton-acento mt-5">
            Suscribirme para recibirlas
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-5">
          {articulos.map((a, i) => {
            // Solo la portada elegida: las demas imagenes ya salen dentro del texto.
            const portada = a.web_cover_url && urlImagenPermitida(a.web_cover_url) ? a.web_cover_url : null
            return (
              <li key={a.id}>
                <article className="tarjeta overflow-hidden">
                  {portada && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portada}
                      alt={`Imagen de la noticia: ${a.web_title}`}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      className="w-full object-cover"
                    />
                  )}
                  <div className="px-5 pt-5 pb-3 sm:px-8 sm:pt-7 sm:pb-5">
                    <time dateTime={a.web_published_at} className="text-[0.9375rem] font-semibold text-tinta-2">
                      {formatearFecha(a.web_published_at)}
                    </time>
                    <h2 className="mt-1.5 text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance sm:text-4xl">
                      {/* El titular lleva a la pagina propia de la noticia, util para compartirla. */}
                      <Link href={`/noticias/${a.id}`} className="rounded-lg hover:text-acento-tinta">
                        {a.web_title}
                      </Link>
                    </h2>
                    {/* La noticia completa, sin tener que pulsar "Leer mas". */}
                    <div className="mt-5">
                      <CuerpoNoticia bloques={a.web_blocks} titular={a.web_title} subtitulo="h3" />
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
