import Link from 'next/link'
import BotonInstalar from '@/components/BotonInstalar'
import FechaHoy from '@/components/FechaHoy'
import { NOMBRE_SITIO } from '@/lib/sitio'

// Cabecera al estilo de Apple News: el nombre en negro y, debajo, la fecha de hoy en gris.
// "portada" la hace mas grande y convierte el nombre en el titulo principal de la pagina.
// Arriba a la derecha, en el hueco sobre el nombre, va el boton de instalar la app (solo sale
// cuando se puede instalar).
export default function Cabecera({ portada = false }: { portada?: boolean }) {
  const letra = portada
    ? 'text-[2.5rem] leading-[1.04] tracking-[-0.035em] sm:text-6xl'
    : 'text-[1.75rem] leading-[1.08] tracking-[-0.03em] sm:text-4xl'
  const Nombre = portada ? 'h1' : 'p'

  return (
    <header className={`relative font-extrabold ${letra} ${portada ? 'pt-12 sm:pt-16' : 'pt-12'}`}>
      <div className="absolute top-2 right-0">
        <BotonInstalar />
      </div>
      <Nombre>
        {portada ? (
          NOMBRE_SITIO
        ) : (
          <Link href="/" className="rounded-lg">
            {NOMBRE_SITIO}
          </Link>
        )}
      </Nombre>
      <p className="text-tinta-3">
        <FechaHoy />
      </p>
    </header>
  )
}
