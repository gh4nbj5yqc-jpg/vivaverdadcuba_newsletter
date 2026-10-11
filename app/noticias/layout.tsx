import MarcoDiario from '@/components/MarcoDiario'

// El boton del chat que acompaña a las noticias lo pone la barra de abajo (components/Navegacion.tsx).
export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return <MarcoDiario>{children}</MarcoDiario>
}
