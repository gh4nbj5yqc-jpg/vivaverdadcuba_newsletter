'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';

const titular = 'font-[family-name:var(--font-playfair)]';
const texto = 'font-[family-name:var(--font-source-serif)]';

// La fecha se calcula en el navegador: la pagina se genera una sola vez al
// compilar y, si se calculara en el servidor, quedaria congelada.
function fechaDeHoy() {
  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return hoy.charAt(0).toUpperCase() + hoy.slice(1);
}
const sinSuscripcion = () => () => {};

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const fecha = useSyncExternalStore(sinSuscripcion, fechaDeHoy, () => '');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className={`${texto} min-h-screen bg-[#fbf8f1] text-[#1a1a1a]`}>
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        {/* Franja superior */}
        <div className="flex items-center justify-between gap-4 border-b border-[#1a1a1a]/20 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-[#1a1a1a]/60 sm:text-xs">
          <span className="min-h-[1em]">{fecha}</span>
          <span className="hidden sm:inline">Boletín semanal</span>
        </div>

        {/* Cabecera del diario */}
        <header className="pt-10 pb-6 text-center sm:pt-14">
          <h1
            className={`${titular} text-[2.6rem] font-black leading-none tracking-tight sm:text-7xl`}
          >
            Viva Verdad Cuba
          </h1>
          <div className="mt-6 border-t-[3px] border-b border-[#1a1a1a] pt-[3px]" />
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#1a1a1a]/60 sm:text-sm">
            Noticias de Cuba · Directo en tu correo
          </p>
        </header>

        {/* Contenido principal */}
        <section className="border-t border-[#1a1a1a]/20 pt-10 pb-12 text-center sm:pt-14">
          <h2 className={`${titular} text-3xl font-bold leading-tight text-balance sm:text-5xl`}>
            Lo que pasa en Cuba y el mundo,
            <span className="block italic font-normal">contado con verdad.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-[#1a1a1a]/75 sm:text-xl">
            Cada semana, un resumen de las noticias más importantes, directo en tu
            correo.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="min-h-12 w-full flex-1 rounded-none border border-[#1a1a1a]/40 bg-white px-4 text-base text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="min-h-12 rounded-none bg-[#1a1a1a] px-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#fbf8f1] transition hover:bg-[#8b1a1a] disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'loading' ? 'Suscribiendo…' : 'Suscribirme'}
            </button>
          </form>

          <div aria-live="polite" className="mx-auto max-w-md">
            {status === 'success' && (
              <p
                role="status"
                className="mt-5 border-l-4 border-[#2f6b3a] bg-[#2f6b3a]/10 px-4 py-3 text-left text-[#1f4a27]"
              >
                <strong>¡Listo!</strong> Te has suscrito. Recibirás la próxima
                edición en tu correo.
              </p>
            )}
            {status === 'error' && (
              <p
                role="alert"
                className="mt-5 border-l-4 border-[#8b1a1a] bg-[#8b1a1a]/10 px-4 py-3 text-left text-[#6b1414]"
              >
                <strong>No pudimos suscribirte.</strong> Revisa tu correo y tu
                conexión e inténtalo de nuevo.
              </p>
            )}
          </div>

          <Link
            href="/noticias"
            className="mt-8 inline-block text-sm text-[#1a1a1a]/60 underline decoration-[#1a1a1a]/25 underline-offset-4 hover:text-[#8b1a1a] hover:decoration-[#8b1a1a]"
          >
            Leer las noticias →
          </Link>
        </section>

        {/* Pie */}
        <footer className="border-t border-[#1a1a1a]/20 py-6 text-center text-xs uppercase tracking-[0.2em] text-[#1a1a1a]/50">
          Viva Verdad Cuba
        </footer>
      </div>
    </main>
  );
}
