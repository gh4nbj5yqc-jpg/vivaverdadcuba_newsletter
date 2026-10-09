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
    <main className="border-t border-[#1a1a1a]/20 pt-6 pb-12">
      <Link href="/noticias" className="text-sm uppercase tracking-[0.15em] text-[#1a1a1a]/60 hover:text-[#8b1a1a]">
        ← Volver a las noticias
      </Link>

      <article className="mt-6">
        <time dateTime={articulo.web_published_at} className="text-xs uppercase tracking-[0.18em] text-[#1a1a1a]/60">
          {formatearFecha(articulo.web_published_at)}
        </time>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight text-balance sm:text-5xl">
          {articulo.web_title}
        </h1>

        {portada && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portada} alt={`Imagen de la noticia: ${articulo.web_title}`} className="mt-6 w-full object-cover" />
        )}

        <div className="mt-6 border-t border-[#1a1a1a]/20 pt-6">
          <CuerpoNoticia bloques={articulo.web_blocks} titular={articulo.web_title} />
        </div>
      </article>

      <aside className="mt-10 border-y-[3px] border-double border-[#1a1a1a] px-1 py-6 text-center">
        <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">¿Te gustó esta noticia?</p>
        <p className="mt-2 text-[#1a1a1a]/75">Recibe las próximas directo en tu correo.</p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-12 items-center bg-[#1a1a1a] px-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#fbf8f1] transition hover:bg-[#8b1a1a]"
        >
          Suscribirme
        </Link>
      </aside>

      <Link
        href="/noticias"
        className="mt-8 inline-block text-sm uppercase tracking-[0.15em] text-[#1a1a1a]/60 hover:text-[#8b1a1a]"
      >
        ← Volver a las noticias
      </Link>
    </main>
  )
}
