import { useId } from 'react'
import { NOMBRE_SITIO, REDES, type Red } from '@/lib/sitio'

// Fila de logos de redes sociales (solo iconos, sin texto), centrada.
// - Si la red tiene direccion en lib/sitio.ts: sale a todo color y es un enlace.
//   En el telefono abre la app de esa red si esta instalada; si no, el navegador.
// - Si todavia no tiene direccion (null): sale opaca y no se puede tocar.

// El orden en que aparecen, de izquierda a derecha.
const ORDEN: { red: Red; nombre: string }[] = [
  { red: 'instagram', nombre: 'Instagram' },
  { red: 'facebook', nombre: 'Facebook' },
  { red: 'x', nombre: 'X' },
  { red: 'threads', nombre: 'Threads' },
  { red: 'tiktok', nombre: 'TikTok' },
]

// Dibujos de los logos que van en blanco sobre un cuadro negro (X, Threads y TikTok).
const TRAZOS: Record<'x' | 'threads' | 'tiktok', string> = {
  x: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z',
  threads:
    'M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z',
  tiktok:
    'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
}

function Icono({ red, degradado }: { red: Red; degradado: string }) {
  if (red === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
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
    )
  }

  if (red === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="#0866ff" />
        <path
          fill="#ffffff"
          d="M9.101 24v-8.289H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246V24Z"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path fill="#ffffff" transform="translate(5.5 5.5) scale(0.5417)" d={TRAZOS[red]} />
    </svg>
  )
}

const CAJA = 'inline-flex h-12 w-12 items-center justify-center'

export default function RedesSociales({ className = '' }: { className?: string }) {
  // Nombre unico para el degradado de Instagram, por si la fila sale mas de una vez.
  const degradado = useId()

  return (
    <ul className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      {ORDEN.map(({ red, nombre }) => {
        const url = REDES[red]
        return (
          <li key={red}>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Síguenos en ${nombre}: ${NOMBRE_SITIO}`}
                title={`Síguenos en ${nombre}`}
                className={`${CAJA} transition duration-200 hover:scale-110 focus-visible:scale-110`}
              >
                <Icono red={red} degradado={degradado} />
              </a>
            ) : (
              <span role="img" aria-label={`${nombre}: próximamente`} title={`${nombre}: próximamente`} className={`${CAJA} opacity-30`}>
                <Icono red={red} degradado={degradado} />
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
