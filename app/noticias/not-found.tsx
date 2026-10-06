import Link from 'next/link'

// 404 amable para /noticias/[id] cuando el articulo no existe o no esta publicado.
export default function NoticiaNoEncontrada() {
  return (
    <main className="border-t border-[#1a1a1a]/20 pt-10 pb-14 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-[#1a1a1a]/60">Error 404</p>
      <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight text-balance sm:text-4xl">
        No encontramos esta noticia
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-[#1a1a1a]/75">
        Puede que el enlace esté mal escrito o que la noticia ya no esté publicada.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/noticias"
          className="inline-flex min-h-12 items-center bg-[#1a1a1a] px-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#fbf8f1] transition hover:bg-[#8b1a1a]"
        >
          Ver todas las noticias
        </Link>
        <Link href="/" className="inline-flex min-h-12 items-center px-4 text-sm underline underline-offset-4 hover:text-[#8b1a1a]">
          Ir a la portada
        </Link>
      </div>
    </main>
  )
}
