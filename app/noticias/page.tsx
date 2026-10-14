import type { Metadata } from 'next'
import Link from 'next/link'
import PestanasNoticias from '@/components/noticias/PestanasNoticias'
import TarjetaNoticia from '@/components/noticias/TarjetaNoticia'
import { diaDe, formatearFecha, haceCuanto, listarArticulos, type ArticuloPublico } from '@/lib/ediciones'
import { esSeccionLocal, nombreSeccion, SECCIONES, seccionDeParam, urlSeccion, type Seccion } from '@/lib/secciones'
import { NOMBRE_SITIO } from '@/lib/sitio'

type Props = { searchParams: Promise<{ [clave: string]: string | string[] | undefined }> }

const descripcion =
  'Lee todas las noticias de Viva Verdad Cuba: lo que pasa en Cuba y el mundo, contado con verdad.'

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const seccion = seccionDeParam((await searchParams).seccion)
  const titulo =
    seccion === 'general' ? `Noticias | ${NOMBRE_SITIO}` : `Noticias de ${nombreSeccion(seccion)} | ${NOMBRE_SITIO}`
  const texto =
    seccion === 'general' ? descripcion : `Las noticias locales de ${nombreSeccion(seccion)} en ${NOMBRE_SITIO}.`
  return {
    title: titulo,
    description: texto,
    alternates: { canonical: urlSeccion(seccion) },
    openGraph: {
      title: titulo,
      description: texto,
      url: urlSeccion(seccion),
      siteName: NOMBRE_SITIO,
      locale: 'es_ES',
      type: 'website',
    },
  }
}

// "Lo último" es lo publicado el dia mas reciente. Todo lo demas son noticias anteriores,
// agrupadas por dia, para que nadie las confunda con las de ahora.
function ListaNoticias({ articulos }: { articulos: ArticuloPublico[] }) {
  const diaReciente = diaDe(articulos[0].web_published_at)
  const ultimas = articulos.filter(a => diaDe(a.web_published_at) === diaReciente)
  const dias: { dia: string; articulos: ArticuloPublico[] }[] = []
  for (const a of articulos.slice(ultimas.length)) {
    const dia = diaDe(a.web_published_at)
    const grupo = dias[dias.length - 1]
    if (grupo && grupo.dia === dia) grupo.articulos.push(a)
    else dias.push({ dia, articulos: [a] })
  }

  return (
    <>
      <section aria-labelledby="lo-ultimo">
        <h2 id="lo-ultimo" className="text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">
          Lo último
        </h2>
        <ul className="mt-4 space-y-5">
          {ultimas.map((a, i) => (
            <li key={a.id}>
              <TarjetaNoticia a={a} conFecha urgente={i === 0} />
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
                    <TarjetaNoticia a={a} conFecha={false} urgente={false} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return <div className="tarjeta px-5 py-6 sm:px-8">{children}</div>
}

async function Contenido({ seccion }: { seccion: Seccion }) {
  // Miami y Houston todavia no tienen noticias: solo el aviso.
  if (!SECCIONES.find(s => s.id === seccion)?.activa) {
    return (
      <Aviso>
        <p className="text-[1.375rem] font-bold tracking-[-0.02em]">Próximamente</p>
        <p className="mt-1.5 text-lg leading-relaxed text-tinta-2">
          Muy pronto tendrás aquí las noticias de {nombreSeccion(seccion)}.
        </p>
      </Aviso>
    )
  }

  const articulos = await listarArticulos(esSeccionLocal(seccion) ? seccion : 'general')
  if (articulos.length > 0) return <ListaNoticias articulos={articulos} />

  if (seccion === 'general') {
    return (
      <Aviso>
        <p className="text-lg leading-relaxed">
          Todavía no hemos publicado ninguna noticia. Muy pronto tendrás aquí las primeras.
        </p>
        <Link href="/" className="boton-acento mt-5">
          Suscribirme para recibirlas
        </Link>
      </Aviso>
    )
  }
  return (
    <Aviso>
      <p className="text-lg leading-relaxed">
        Todavía no hemos publicado noticias de {nombreSeccion(seccion)}. Muy pronto tendrás aquí las primeras.
      </p>
    </Aviso>
  )
}

export default async function NoticiasPage({ searchParams }: Props) {
  // Leer ?seccion= hace que la pagina se genere en cada visita: los articulos nuevos aparecen al momento.
  const seccion = seccionDeParam((await searchParams).seccion)

  return (
    <main className="pt-5 pb-10">
      <h1 className="sr-only">{seccion === 'general' ? 'Noticias' : `Noticias de ${nombreSeccion(seccion)}`}</h1>
      <PestanasNoticias activa={seccion} />
      <div className="mt-6">
        <Contenido seccion={seccion} />
      </div>
    </main>
  )
}
