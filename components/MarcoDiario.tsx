import Link from 'next/link'
import RedesSociales from '@/components/RedesSociales'

// Cabecera y pie de diario que comparten las paginas de noticias y el chat.
export default function MarcoDiario({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf8f1] font-[family-name:var(--font-source-serif)] text-[#1a1a1a]">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <header className="pt-8 pb-3 text-center sm:pt-10">
          <Link
            href="/"
            className="font-[family-name:var(--font-playfair)] text-3xl font-black leading-none tracking-tight sm:text-5xl"
          >
            Viva Verdad Cuba
          </Link>
          <div className="mt-5 border-t-[3px] border-b border-[#1a1a1a] pt-[3px]" />
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#1a1a1a]/60">
            Noticias de Cuba
          </p>
          <nav aria-label="Secciones" className="mt-2 flex justify-center gap-6 text-xs font-semibold uppercase tracking-[0.2em]">
            <Link href="/noticias" className="py-2 hover:text-[#8b1a1a]">Noticias</Link>
            <Link href="/chat" className="py-2 hover:text-[#8b1a1a]">Chat</Link>
          </nav>
        </header>

        {children}

        <footer className="border-t border-[#1a1a1a]/20 py-6 text-center text-xs uppercase tracking-[0.2em] text-[#1a1a1a]/50">
          <RedesSociales className="mb-3" />
          <p>Viva Verdad Cuba</p>
        </footer>
      </div>
    </div>
  )
}
