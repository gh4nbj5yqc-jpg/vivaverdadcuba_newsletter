import type { Metadata } from 'next'
import MarcoDiario from '@/components/MarcoDiario'
import PestanasNoticias from '@/components/noticias/PestanasNoticias'
import TarjetaNoticia from '@/components/noticias/TarjetaNoticia'
import { esAdmin } from '@/lib/admin-auth'
import { ErrorNoticia } from '@/lib/noticias-admin'
import { obtenerLocal } from '@/lib/noticias-locales'

// Vista previa de una noticia local tal como saldra en /noticias (pestaña de su ciudad).
// La abre el panel dentro de un marco, a ancho de movil o de ordenador. Solo para el admin,
// y siempre con lo guardado (tambien los borradores, que aun no se ven en la web).

export const metadata: Metadata = { title: 'Vista previa', robots: { index: false, follow: false } }

type Props = { params: Promise<{ id: string }> }

function Mensaje({ texto }: { texto: string }) {
  return (
    <MarcoDiario>
      <div className="tarjeta mt-7 px-5 py-6 text-lg">{texto}</div>
    </MarcoDiario>
  )
}

export default async function VistaLocal({ params }: Props) {
  if (!(await esAdmin())) return <Mensaje texto="Tu sesión expiró. Vuelve a entrar en el panel." />

  const { id } = await params
  let noticia
  try {
    noticia = await obtenerLocal(id)
  } catch (e) {
    return <Mensaje texto={e instanceof ErrorNoticia ? e.message : 'No se pudo cargar la noticia.'} />
  }

  return (
    <MarcoDiario>
      <main className="pt-5 pb-10">
        <PestanasNoticias activa={noticia.seccion} soloVista />
        <section className="mt-6">
          <h2 className="text-[1.375rem] font-bold tracking-[-0.02em] text-acento-tinta">Lo último</h2>
          <div className="mt-4">
            <TarjetaNoticia
              a={{
                id: noticia.id,
                web_title: noticia.web_title || 'Sin titular',
                web_cover_url: noticia.web_cover_url,
                web_blocks: noticia.web_blocks ?? [],
                // Un borrador aun no tiene fecha de publicacion: se muestra la de hoy.
                web_published_at: noticia.web_published_at ?? new Date().toISOString(),
              }}
              conFecha
              urgente
              enlace={false}
            />
          </div>
        </section>
      </main>
    </MarcoDiario>
  )
}
