import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { listarEdiciones, formatearFecha, adelanto } from '@/lib/ediciones'

export const metadata: Metadata = {
  title: 'Noticias | Viva Verdad Cuba',
  description:
    'Lee todas las ediciones de Viva Verdad Cuba: un resumen semanal de las noticias más importantes de Cuba.',
}

export default async function NoticiasPage() {
  // Se genera en cada visita para que las ediciones nuevas aparezcan al momento.
  await connection()
  const ediciones = await listarEdiciones()

  return (
    <main className="border-t border-[#1a1a1a]/20 pt-8 pb-12">
      <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold sm:text-4xl">
        Todas las ediciones
      </h1>

      {ediciones.length === 0 ? (
        <div className="mt-8 border-l-4 border-[#1a1a1a]/30 bg-white/60 px-5 py-6">
          <p className="text-lg leading-relaxed">
            Todavía no hemos publicado ninguna edición. ¡Muy pronto tendrás aquí las
            primeras noticias!
          </p>
          <Link href="/" className="mt-4 inline-block font-semibold underline underline-offset-4 hover:text-[#8b1a1a]">
            Suscríbete para recibir la primera →
          </Link>
        </div>
      ) : (
        <ul className="mt-6">
          {ediciones.map(ed => (
            <li key={ed.id} className="border-b border-[#1a1a1a]/20 last:border-b-0">
              <Link href={`/noticias/${ed.id}`} className="group block py-7">
                <time
                  dateTime={ed.published_at}
                  className="text-xs uppercase tracking-[0.18em] text-[#1a1a1a]/60"
                >
                  {formatearFecha(ed.published_at)}
                </time>
                <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-snug group-hover:text-[#8b1a1a] sm:text-3xl">
                  {ed.title}
                </h2>
                {ed.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ed.image_url}
                    alt=""
                    loading="lazy"
                    className="mt-4 aspect-[16/9] w-full object-cover"
                  />
                )}
                <p className="mt-3 text-lg leading-relaxed text-[#1a1a1a]/75">
                  {adelanto(ed.content)}
                </p>
                <span className="mt-3 inline-block text-sm font-semibold uppercase tracking-[0.15em] group-hover:text-[#8b1a1a]">
                  Leer más →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
