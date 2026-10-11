import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import CuerpoNoticia from '@/components/noticias/CuerpoNoticia'
import { urlImagenPermitida } from '@/lib/bloques'
import { obtenerArticulo, formatearFecha, adelanto, portadaDe } from '@/lib/ediciones'
import { NOMBRE_SITIO } from '@/lib/sitio'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const articulo = await obtenerArticulo(id)
  if (!articulo) return { title: `Noticia no encontrada | ${NOMBRE_SITIO}` }

  const descripcion = adelanto(articulo, 155)
  const portada = portadaDe(articulo)
  const ruta = `/noticias/${articulo.id}`
  return {
    title: `${articulo.web_title} | ${NOMBRE_SITIO}`,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      title: articulo.web_title,
      description: descripcion,
      url: ruta,
      type: 'article',
      locale: 'es_ES',
      publishedTime: articulo.web_published_at,
      siteName: NOMBRE_SITIO,
      images: portada ? [{ url: portada, alt: articulo.web_title }] : undefined,
    },
    twitter: {
      card: portada ? 'summary_large_image' : 'summary',
      title: articulo.web_title,
      description: descripcion,
      images: portada ? [portada] : undefined,
    },
  }
}

export default async function ArticuloPage({ params }: Props) {
  await connection()
  const { id } = await params
  const articulo = await obtenerArticulo(id)
  if (!articulo) notFound()

  // Solo la portada elegida; si no hay, no se repite la primera imagen del texto.
  const portada = articulo.web_cover_url && urlImagenPermitida(articulo.web_cover_url) ? articulo.web_cover_url : null

  return (
    <main className="pt-5 pb-10">
      {/* Boton de volver, de cristal: se queda arriba mientras se lee y deja ver la noticia por debajo. */}
      <Link
        href="/noticias"
        aria-label="Volver a las noticias"
        title="Volver a las noticias"
        className="cristal sticky top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m14.5 5-7 7 7 7" />
        </svg>
      </Link>

      <article className="tarjeta mt-4 overflow-hidden">
        {portada && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portada} alt={`Imagen de la noticia: ${articulo.web_title}`} className="w-full object-cover" />
        )}
        <div className="px-5 pt-5 pb-3 sm:px-8 sm:pt-7 sm:pb-5">
          <time dateTime={articulo.web_published_at} className="text-[0.9375rem] font-semibold text-tinta-2">
            {formatearFecha(articulo.web_published_at)}
          </time>
          <h1 className="mt-1.5 text-[2rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-pretty sm:text-5xl">
            {articulo.web_title}
          </h1>
          <div className="mt-6">
            <CuerpoNoticia bloques={articulo.web_blocks} titular={articulo.web_title} />
          </div>
        </div>
      </article>

      <aside className="tarjeta mt-5 px-5 py-7 text-center sm:px-8">
        <p className="text-2xl font-extrabold tracking-[-0.02em]">¿Te gustó esta noticia?</p>
        <p className="mt-1.5 text-[1.0625rem] text-tinta-2">Recibe las próximas directo en tu correo.</p>
        <Link href="/" className="boton-acento mt-5">
          Suscribirme
        </Link>
      </aside>
    </main>
  )
}
