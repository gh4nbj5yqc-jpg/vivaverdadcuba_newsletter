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
          {articulos.map((a, i) => {
            // Solo la portada elegida: las demas imagenes ya salen dentro del texto.
            const portada = a.web_cover_url && urlImagenPermitida(a.web_cover_url) ? a.web_cover_url : null
            return (
              <li key={a.id} className="border-b-[3px] border-double border-[#1a1a1a] pt-9 pb-5 first:pt-2 last:border-b-0">
                <article>
                  <time dateTime={a.web_published_at} className="text-xs uppercase tracking-[0.18em] text-[#1a1a1a]/60">
                    {formatearFecha(a.web_published_at)}
                  </time>
                  <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight text-balance sm:text-4xl">
                    {/* El titular lleva a la pagina propia de la noticia, util para compartirla. */}
                    <Link href={`/noticias/${a.id}`} className="hover:text-[#8b1a1a]">
                      {a.web_title}
                    </Link>
                  </h2>
                  {portada && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portada}
                      alt={`Imagen de la noticia: ${a.web_title}`}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      className="mt-5 w-full object-cover"
                    />
                  )}
                  {/* La noticia completa, sin tener que pulsar "Leer mas". */}
                  <div className="mt-5">
                    <CuerpoNoticia bloques={a.web_blocks} titular={a.web_title} subtitulo="h3" />
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
