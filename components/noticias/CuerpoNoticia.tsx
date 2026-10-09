import { parrafos, type Bloque } from '@/lib/bloques'
import { bloquesVisibles, altImagen } from '@/lib/ediciones'

// Cuerpo completo de una noticia (imagenes, subtitulos y parrafos).
// Lo comparten la lista /noticias y la pagina de cada noticia, para que
// se vean igual en los dos sitios.
// "subtitulo" indica el nivel del encabezado: h2 en la pagina de una noticia
// (el titular es h1) y h3 en la lista (alli el titular es h2).
export default function CuerpoNoticia({
  bloques,
  titular,
  subtitulo: Subtitulo = 'h2',
}: {
  bloques: Bloque[]
  titular: string
  subtitulo?: 'h2' | 'h3'
}) {
  return (
    <>
      {bloquesVisibles(bloques).map(b =>
        b.tipo === 'imagen' ? (
          <figure key={b.id} className="my-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.url} alt={altImagen(b, titular)} loading="lazy" className="w-full" />
            {b.pie && (
              <figcaption className="mt-2 border-l-2 border-[#1a1a1a]/30 pl-3 text-sm italic text-[#1a1a1a]/70">
                {b.pie}
              </figcaption>
            )}
          </figure>
        ) : (
          <section key={b.id} className="mb-2">
            {b.subtitulo && (
              <Subtitulo className="mt-8 mb-3 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-snug sm:text-3xl">
                {b.subtitulo}
              </Subtitulo>
            )}
            {parrafos(b.texto).map((p, i) => (
              <p key={i} className="mb-5 text-lg leading-relaxed sm:text-xl">
                {p}
              </p>
            ))}
          </section>
        )
      )}
    </>
  )
}
