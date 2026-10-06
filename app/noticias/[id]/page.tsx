import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { obtenerEdicion, formatearFecha, parrafos, adelanto } from '@/lib/ediciones'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const edicion = await obtenerEdicion(id)
  if (!edicion) return { title: 'Edición no encontrada | Viva Verdad Cuba' }

  const descripcion = adelanto(edicion.content, 155)
  return {
    title: `${edicion.title} | Viva Verdad Cuba`,
    description: descripcion,
    openGraph: {
      title: edicion.title,
      description: descripcion,
      type: 'article',
      publishedTime: edicion.published_at,
      siteName: 'Viva Verdad Cuba',
      images: edicion.image_url ? [edicion.image_url] : undefined,
    },
  }
}

export default async function EdicionPage({ params }: Props) {
  await connection()
  const { id } = await params
  const edicion = await obtenerEdicion(id)
  if (!edicion) notFound()

  return (
    <main className="border-t border-[#1a1a1a]/20 pt-6 pb-12">
      <Link
        href="/noticias"
        className="text-sm uppercase tracking-[0.15em] text-[#1a1a1a]/60 hover:text-[#8b1a1a]"
      >
        ← Volver a las noticias
      </Link>

      <article className="mt-6">
        <time
          dateTime={edicion.published_at}
          className="text-xs uppercase tracking-[0.18em] text-[#1a1a1a]/60"
        >
          {formatearFecha(edicion.published_at)}
        </time>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight sm:text-5xl">
          {edicion.title}
        </h1>

        {edicion.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={edicion.image_url}
            alt=""
            className="mt-6 w-full object-cover"
          />
        )}

        <div className="mt-6 border-t border-[#1a1a1a]/20 pt-6">
          {parrafos(edicion.content).map((p, i) => (
            <p key={i} className="mb-5 text-lg leading-relaxed sm:text-xl">
              {p}
            </p>
          ))}
        </div>
      </article>

      <aside className="mt-10 border-y-[3px] border-double border-[#1a1a1a] px-1 py-6 text-center">
        <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
          ¿Te gustó esta edición?
        </p>
        <p className="mt-2 text-[#1a1a1a]/75">Recibe la próxima directo en tu correo.</p>
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
