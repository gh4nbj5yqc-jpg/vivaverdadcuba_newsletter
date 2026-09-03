'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
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
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Viva Verdad Cuba
        </h1>
        <p className="text-gray-500 mb-8">
          Recibe un resumen semanal de las noticias más importantes, directo en tu correo.
        </p>

        <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-black text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 transition"
          >
            {status === 'loading' ? 'Suscribiendo...' : 'Suscribirme'}
          </button>
        </form>

        {status === 'success' && (
          <p className="mt-4 text-green-600">¡Gracias! Ya estás suscrito.</p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-red-500">Hubo un error. Intenta de nuevo.</p>
        )}
      </div>
    </main>
  );
}