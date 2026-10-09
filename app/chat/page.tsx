import type { Metadata } from 'next'
import Chat from '@/components/chat/Chat'
import { NOMBRE_SITIO } from '@/lib/sitio'

const descripcion = 'Chat abierto y anónimo de Viva Verdad Cuba: opina sin dar tu nombre ni tu correo.'

export const metadata: Metadata = {
  title: `Chat | ${NOMBRE_SITIO}`,
  description: descripcion,
  alternates: { canonical: '/chat' },
  // Lo que se escribe en el chat es de los visitantes y dura 3 dias: no se ofrece a los buscadores.
  robots: { index: false },
}

export default function ChatPage() {
  return <Chat variante="pagina" />
}
