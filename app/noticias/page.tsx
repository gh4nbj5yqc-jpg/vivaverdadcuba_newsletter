import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import CuerpoNoticia from '@/components/noticias/CuerpoNoticia'
import { urlImagenPermitida } from '@/lib/bloques'
import { diaDe, formatearFecha, haceCuanto, listarArticulos, type ArticuloPublico } from '@/lib/ediciones'
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

// Una noticia completa en su tarjeta. "conFecha" pone la fecha dentro de la tarjeta;
// en las noticias anteriores no hace falta, porque la fecha va en grande encima.
function Noticia({ a, conFecha, urgente }: { a: ArticuloPublico; conFecha: boolean; urgente: boolean }) {
  // Solo la portada elegida: las demas imagenes ya salen dentro del texto.
  const portada = a.web_cover_url && urlImagenPermitida(a.web_cover_url) ? a.web_cover_url : null
  return (
    <article className="tarjeta overflow-hidden">
      {portada && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portada}
          alt={`Imagen de la noticia: ${a.web_title}`}
          loading={urgente ? 'eager' : 'lazy'}
          className="w-full object-cover"
        />
      )}
      <div className="px-5 pt-5 pb-3 sm:px-8 sm:pt-7 sm:pb-5">
        {conFecha && (
          <time dateTime={a.web_published_at} className="text-[0.9375rem] font-semibold text-tinta-2">
            {formatearFecha(a.web_published_at)}
          </time>
        )}
        <h3 className={`${conFecha ? 'mt-1.5' : ''} text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance sm:text-4xl`}>
          {/* El titular lleva a la pagina propia de la noticia, util para compartirla. */}
          <Link href={`/noticias/${a.id}`} className="rounded-lg hover:text-acento-tinta">
            {a.web_title}
          </Link>
        </h3>
        {/* La noticia completa, sin tener que pulsar "Leer mas". */}
        <div className="mt-5">
          <CuerpoNoticia bloques={a.web_blocks} titular={a.web_title} subtitulo="h4" />
        </div>
      </div>
    </article>
  )
}

export default async function NoticiasPage() {
  // Se genera en cada visita para que los articulos nuevos aparezcan al momento.
  await connection()
  const articulos = await listarArticulos()

  // "Lo último" es lo publicado el dia mas reciente. Todo lo demas son noticias anteriores,
  // agrupadas por dia, para que nadie las confunda con las de ahora.
  const diaReciente = articulos.length ? diaDe(articulos[0].web_published_at) : ''
  const ultimas = articulos.filter(a => diaDe(a.web_published_at) === diaReciente)
  const dias: { dia: string; articulos: ArticuloPublico[] }[] = []
  for (const a of articulos.slice(ultimas.length)) {
    const dia = diaDe(a.web_published_at)
    const grupo = dias[dias.length - 1]
    if (grupo && grupo.dia === dia) grupo.articulos.push(a)
    else dias.push({ dia, articulos: [a] })
  }

  return (
    <main className="pt-7 pb-10">
      <h1 className="sr-only">Noticias</h1>

      {articulos.length === 0 ? (
        <div className="tarjeta px-5 py-6 sm:px-8">
          <p className="text-lg leading-relaxed">
            Todavía no hemos publicado ninguna noticia. Muy pronto tendrás aquí las primeras.
          </p>
          <Link href="/" className="boton-acento mt-5">
            Suscribirme para recibirlas
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="lo-ultimo">
            <h2 id="lo-ultimo" className="text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">
              Lo último
            </h2>
            <ul className="mt-4 space-y-5">
              {ultimas.map((a, i) => (
                <li key={a.id}>
                  <Noticia a={a} conFecha urgente={i === 0} />
                </li>
              ))}
            </ul>
          </section>

          {dias.length > 0 && (
            <section aria-labelledby="anteriores" className="mt-12 border-t-2 border-linea pt-9">
              <h2 id="anteriores" className="text-[1.75rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-4xl">
                Noticias anteriores
              </h2>
              <p className="mt-1.5 text-[1.0625rem] leading-snug text-tinta-2">
                Lo que publicamos en días pasados, cada noticia con su fecha.
              </p>

              {dias.map(grupo => (
                <div key={grupo.dia} className="mt-8">
                  {/* La fecha, en grande, encima de las noticias de ese dia. */}
                  <p className="flex flex-wrap items-baseline justify-between gap-x-3 px-1">
                    <time dateTime={grupo.dia} className="text-[1.375rem] font-bold tracking-[-0.02em]">
                      {formatearFecha(grupo.articulos[0].web_published_at)}
                    </time>
                    <span className="text-[0.9375rem] font-semibold text-tinta-2">
                      {haceCuanto(grupo.articulos[0].web_published_at)}
                    </span>
                  </p>
                  <ul className="mt-3 space-y-5">
                    {grupo.articulos.map(a => (
                      <li key={a.id}>
                        <Noticia a={a} conFecha={false} urgente={false} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  )
}
