import { useId } from 'react'
import { INSTAGRAM_URL, NOMBRE_SITIO } from '@/lib/sitio'

// Logo de Instagram (solo el icono, sin texto, con sus colores) que lleva al perfil.
// En el telefono, este enlace abre la app de Instagram si esta instalada;
// si no, abre el perfil en el navegador.
export default function EnlaceInstagram({ className = '' }: { className?: string }) {
  // Nombre unico para el degradado, por si el logo sale mas de una vez en la pagina.
  const degradado = useId()

  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Síguenos en Instagram: ${NOMBRE_SITIO}`}
      title="Síguenos en Instagram"
      className={`inline-flex h-14 w-14 items-center justify-center transition duration-200 hover:scale-110 focus-visible:scale-110 ${className}`}
    >
      <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
        <defs>
          <radialGradient id={degradado} cx="0.3" cy="1.07" r="1.5">
            <stop offset="0" stopColor="#fdf497" />
            <stop offset="0.05" stopColor="#fdf497" />
            <stop offset="0.45" stopColor="#fd5949" />
            <stop offset="0.6" stopColor="#d6249f" />
            <stop offset="0.9" stopColor="#285aeb" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill={`url(#${degradado})`} />
        <g fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" rx="4" />
          <circle cx="12" cy="12" r="3.3" />
        </g>
        <circle cx="16.1" cy="7.9" r="1" fill="#ffffff" />
      </svg>
    </a>
  )
}
