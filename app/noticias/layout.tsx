import MarcoDiario from '@/components/MarcoDiario'
import ChatFlotante from '@/components/chat/ChatFlotante'

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarcoDiario>
      {children}
      {/* El globo del chat acompaña a todas las paginas de noticias. */}
      <ChatFlotante />
    </MarcoDiario>
  )
}
