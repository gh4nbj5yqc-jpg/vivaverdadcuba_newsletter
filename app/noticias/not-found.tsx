import Link from 'next/link'

// 404 amable para /noticias/[id] cuando el articulo no existe o no esta publicado.
export default function NoticiaNoEncontrada() {
  return (
    <main className="pt-7 pb-10">
      <div className="tarjeta px-5 py-10 text-center sm:px-8">
        <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance sm:text-4xl">
          No encontramos esta noticia
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[1.0625rem] leading-relaxed text-tinta-2">
          Puede que el enlace esté mal escrito o que la noticia ya no esté publicada.
        </p>
        <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
          <Link href="/noticias" className="boton-acento">
            Ver todas las noticias
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center rounded-full px-4 text-[1.0625rem] font-semibold text-acento-tinta">
            Ir a la portada
          </Link>
        </div>
      </div>
    </main>
  )
}
