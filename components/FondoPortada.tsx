// Fondo de la portada: un atardecer en el Malecon de La Habana, dibujado a mano.
// El cielo, el sol y el mar dan el color que se ve a traves del cristal del recuadro de suscripcion;
// la silueta del faro del Morro, el Capitolio y unas palmas dicen "Cuba" sin usar la bandera.
// Es decorativo: no se anuncia a los lectores de pantalla.

const SILUETA = '#1c1638'

// Una palma real: tronco fino y hojas en arco. (x, y) es el pie del tronco.
function Palma({ x, y, alto, inclinacion = 0 }: { x: number; y: number; alto: number; inclinacion?: number }) {
  const cx = x + inclinacion
  const cy = y - alto
  const hoja = (dx: number, dy: number, caida: number) =>
    `M${cx} ${cy}q${dx * 0.55} ${dy - Math.abs(dx) * 0.25} ${dx} ${dy + caida}`
  return (
    <g fill="none" stroke={SILUETA} strokeLinecap="round">
      <path d={`M${x} ${y}Q${x + inclinacion * 0.2} ${y - alto * 0.55} ${cx} ${cy}`} strokeWidth="2.1" />
      <g strokeWidth="1.9">
        <path d={hoja(-15, -2, 8)} />
        <path d={hoja(15, -2, 8)} />
        <path d={hoja(-11, -9, 5)} />
        <path d={hoja(11, -9, 5)} />
        <path d={hoja(-5, -13, 3)} />
        <path d={hoja(6, -13, 3)} />
        <path d={hoja(-13, 4, 9)} />
        <path d={hoja(13, 4, 9)} />
      </g>
    </g>
  )
}

export default function FondoPortada({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 400"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <linearGradient id="portada-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2f8a" />
          <stop offset="0.38" stopColor="#8b3f96" />
          <stop offset="0.68" stopColor="#ef5f72" />
          <stop offset="0.9" stopColor="#ff9f58" />
          <stop offset="1" stopColor="#ffd08a" />
        </linearGradient>
        <linearGradient id="portada-mar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9788a" />
          <stop offset="0.12" stopColor="#3f8fa8" />
          <stop offset="0.45" stopColor="#0f7f8f" />
          <stop offset="1" stopColor="#0a4a6b" />
        </linearGradient>
        <radialGradient id="portada-resplandor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#ffb866" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff9f58" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="portada-reflejo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
        </linearGradient>
        <filter id="portada-suave" x="-30%" y="-10%" width="160%" height="120%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Cielo y sol, hasta el horizonte (y = 112). */}
      <rect width="600" height="112" fill="url(#portada-cielo)" />
      <circle cx="352" cy="104" r="70" fill="url(#portada-resplandor)" />
      <circle cx="352" cy="104" r="20" fill="#fff3cf" />

      {/* Mar, con el reflejo del sol. */}
      <rect y="112" width="600" height="288" fill="url(#portada-mar)" />
      <path d="M338 114h28l26 190h-80z" fill="url(#portada-reflejo)" filter="url(#portada-suave)" />

      {/* La ciudad en el horizonte. */}
      <g fill={SILUETA}>
        {/* Casas bajas del Malecon. */}
        <path d="M0 112V99h22v-5h18v7h16v-9h20v6h14v-4h16v9h12v8z" />
        <path d="M236 112v-9h14v-5h16v-4h12v18z" />
        <path d="M356 112v-12h16v-6h14v9h18v-5h12v14z" />
        <path d="M452 112v-10h18v-7h20v5h14v-8h22v9h16v-5h20v-6h18v8h20v14z" />

        {/* El Morro: la fortaleza sobre la roca y su faro. */}
        <path d="M118 112l8-12h14l4-7h58l10 8h14l10 11z" />
        <path d="M176 93l2.6-34h6.8l2.6 34z" />
        <rect x="175.5" y="57" width="13" height="2.6" rx="0.8" />
        <rect x="178.5" y="50" width="7" height="7" />
        <path d="M177 50h10l-5-6.5z" />

        {/* El Capitolio: el cuerpo, el portico y la cupula con su linterna. */}
        <path d="M262 112V98h84v14z" />
        <path d="M288 98v-7h32v7z" />
        <path d="M293 91v-9h22v9z" />
        <path d="M293 82c0-15 5-23 11-23s11 8 11 23z" />
        <rect x="301.5" y="52" width="5" height="8" />
        <rect x="303.3" y="45" width="1.4" height="8" />
      </g>

      <Palma x={418} y={112} alto={42} inclinacion={5} />
      <Palma x={436} y={112} alto={30} inclinacion={-3} />
      <Palma x={232} y={112} alto={34} inclinacion={-4} />
    </svg>
  )
}
