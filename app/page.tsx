'use client';

import Link from 'next/link';
import { useState } from 'react';
import FondoPortada from '@/components/FondoPortada';
import Cabecera from '@/components/Cabecera';
import RedesSociales from '@/components/RedesSociales';
import { NOMBRE_SITIO } from '@/lib/sitio';

// Las dos secciones de la web, como filas de una lista del iPhone.
const SECCIONES = [
  { href: '/noticias', nombre: 'Noticias', detalle: 'Todo lo que hemos publicado' },
  { href: '/chat', nombre: 'Chat', detalle: 'Opina sin dar tu nombre ni tu correo' },
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [conUltimoCorreo, setConUltimoCorreo] = useState(false);

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
        const datos = await res.json().catch(() => null);
        setConUltimoCorreo(Boolean(datos?.ultimoCorreo));
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
    <div className="min-h-screen bg-fondo font-sans text-tinta">
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <Cabecera portada />

        {/* Suscripcion: un recuadro de cristal sobre un atardecer en el Malecon. */}
        <section className="relative isolate mt-7 overflow-hidden rounded-[2rem] px-3 pt-36 pb-3 sm:px-4 sm:pt-48 sm:pb-4">
          <FondoPortada className="-z-10" />

          <div className="cristal rounded-[1.5rem] px-5 py-6 sm:px-8 sm:py-8">
            <h2 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance sm:text-4xl">
              Lo que pasa en Cuba y el mundo, contado con verdad.
            </h2>
            <p className="mt-3 text-[1.0625rem] leading-snug text-tinta-2 sm:text-lg">
              Cada semana, un resumen de las noticias más importantes, directo en tu correo.
            </p>

            <form onSubmit={handleSubscribe} className="mt-6 flex flex-col gap-2.5 sm:flex-row">
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
                className="min-h-12 w-full flex-1 rounded-full bg-superficie px-5 text-[1.0625rem] text-tinta shadow-[inset_0_0_0_1px_var(--linea)] placeholder:text-tinta-3 focus:shadow-[inset_0_0_0_2px_var(--acento)] focus:outline-none"
              />
              <button type="submit" disabled={status === 'loading'} className="boton-acento">
                {status === 'loading' ? 'Suscribiendo…' : 'Suscribirme'}
              </button>
            </form>

            <div aria-live="polite">
              {status === 'success' && (
                <p role="status" className="mt-4 rounded-2xl bg-superficie px-4 py-3.5 leading-snug">
                  <strong className="text-[#1d8a3a] dark:text-[#30d158]">¡Listo!</strong> Te has suscrito.{' '}
                  {conUltimoCorreo
                    ? 'Te acabamos de enviar nuestro último correo.'
                    : 'Recibirás la próxima edición en tu correo.'}{' '}
                  Si no lo ves en la bandeja de entrada, búscalo en Spam o
                  Promociones y márcalo como «No es spam» para no perderte los
                  siguientes.
                </p>
              )}
              {status === 'error' && (
                <p role="alert" className="mt-4 rounded-2xl bg-superficie px-4 py-3.5 leading-snug">
                  <strong className="text-acento-tinta">No pudimos suscribirte.</strong> Revisa tu correo y tu
                  conexión e inténtalo de nuevo.
                </p>
              )}
            </div>
          </div>
        </section>

        <nav aria-label="Secciones de la web" className="tarjeta mt-5 overflow-hidden">
          <ul className="divide-y divide-linea">
            {SECCIONES.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex min-h-[4.25rem] items-center gap-3 px-5 py-3 transition hover:bg-relleno active:bg-relleno"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.0625rem] font-semibold">{s.nombre}</span>
                    <span className="block text-[0.9375rem] text-tinta-2">{s.detalle}</span>
                  </span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-tinta-3">
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* El hueco de abajo deja sitio a la barra flotante. */}
        <footer className="pt-8 pb-32 text-center text-sm text-tinta-2">
          <RedesSociales className="mb-3" />
          <p>{NOMBRE_SITIO}</p>
        </footer>
      </main>
    </div>
  );
}
