import { parrafos, type Bloque } from '@/lib/bloques'
import { bloquesVisibles, altImagen } from '@/lib/ediciones'

// Cuerpo completo de una noticia (imagenes, subtitulos y parrafos).
// Lo comparten la lista /noticias y la pagina de cada noticia, para que
// se vean igual en los dos sitios.
// "subtitulo" indica el nivel del encabezado: h2 en la pagina de una noticia
// (el titular es h1) y h4 en la lista (alli el titular es h3).
export default function CuerpoNoticia({
  bloques,
  titular,
  subtitulo: Subtitulo = 'h2',
}: {
  bloques: Bloque[]
  titular: string
  subtitulo?: 'h2' | 'h3' | 'h4'
}) {
  return (
    <>
      {bloquesVisibles(bloques).map(b =>
        b.tipo === 'imagen' ? (
          <figure key={b.id} className="my-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.url} alt={altImagen(b, titular)} loading="lazy" className="w-full rounded-2xl" />
            {b.pie && <figcaption className="mt-2 px-1 text-sm leading-snug text-tinta-2">{b.pie}</figcaption>}
          </figure>
        ) : (
          <section key={b.id}>
            {b.subtitulo && (
              <Subtitulo className="mt-8 mb-3 text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-[1.75rem]">
                {b.subtitulo}
              </Subtitulo>
            )}
            {/* El texto de lectura va en letra con serifa, como los articulos de Apple News. */}
            {parrafos(b.texto).map((p, i) => (
              <p key={i} className="mb-5 font-serif text-[1.1875rem] leading-[1.6] sm:text-xl sm:leading-[1.6]">
                {p}
              </p>
            ))}
          </section>
        )
      )}
    </>
  )
}
