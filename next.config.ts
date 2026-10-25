import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El circulito de Next.js (solo se ve en localhost) va a la derecha, para no tapar el globo del chat.
  devIndicators: { position: 'bottom-right' },

  // El service worker de las notificaciones (public/sw.js) no se guarda en cache: asi los
  // telefonos reciben enseguida cualquier cambio que se le haga.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
