import type { MetadataRoute } from 'next'
import { NOMBRE_SITIO } from '@/lib/sitio'

// Manifiesto de la app: lo que lee el telefono al "Agregar a la pantalla de inicio".
// Los iconos se crean con scripts/generar-iconos.tsx. Los colores son los de globals.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOMBRE_SITIO,
    short_name: NOMBRE_SITIO,
    description: 'Las noticias más importantes de Cuba y el mundo, contadas con verdad.',
    lang: 'es',
    start_url: '/',
    scope: '/',
    // Se abre como una app: a pantalla completa, sin la barra del navegador.
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f2f2f7',
    theme_color: '#f2f2f7',
    icons: [
      { src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/iconos/icono-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/iconos/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
