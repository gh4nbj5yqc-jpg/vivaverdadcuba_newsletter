import Link from 'next/link'
import CuerpoNoticia from '@/components/noticias/CuerpoNoticia'
import { urlImagenPermitida, type Bloque } from '@/lib/bloques'
import { formatearFecha } from '@/lib/ediciones'

// Una noticia completa en su tarjeta, como sale en /noticias. La usan la lista (general y
// locales) y la vista previa del panel, para que la vista previa sea exactamente igual.
// "conFecha" pone la fecha dentro de la tarjeta; en las noticias anteriores no hace falta,
// porque la fecha va en grande encima. "enlace" = false en la vista previa: un borrador
// todavia no tiene pagina propia.
type Noticia = {
  id: string
  web_title: string
  web_cover_url: string | null
  web_blocks: Bloque[]
  web_published_at: string
}

export default function TarjetaNoticia({
  a,
  conFecha,
  urgente,
  enlace = true,
}: {
  a: Noticia
  conFecha: boolean
  urgente: boolean
  enlace?: boolean
}) {
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
          {enlace ? (
            <Link href={`/noticias/${a.id}`} className="rounded-lg hover:text-acento-tinta">
              {a.web_title}
            </Link>
          ) : (
            a.web_title
          )}
        </h3>
        {/* La noticia completa, sin tener que pulsar "Leer mas". */}
        <div className="mt-5">
          <CuerpoNoticia bloques={a.web_blocks} titular={a.web_title} subtitulo="h4" />
        </div>
      </div>
    </article>
  )
}
