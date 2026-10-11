import Cabecera from '@/components/Cabecera'
import RedesSociales from '@/components/RedesSociales'
import { NOMBRE_SITIO } from '@/lib/sitio'

// Marco que comparten las paginas de noticias, el chat y la baja: cabecera y pie.
// La barra flotante de abajo la pone el marco general de la web (app/layout.tsx).
export default function MarcoDiario({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-fondo font-sans text-tinta">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Cabecera />

        {children}

        {/* El hueco de abajo deja sitio a la barra flotante. */}
        <footer className="pt-2 pb-32 text-center text-sm text-tinta-2">
          <RedesSociales className="mb-3" />
          <p>{NOMBRE_SITIO}</p>
        </footer>
      </div>
    </div>
  )
}
