// La bandera cubana, ligeramente desenfocada, como fondo de la portada. Es lo que se ve
// a traves del cristal del recuadro de suscripcion. Es decorativa: no se anuncia a los lectores de pantalla.
export default function Bandera({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 400"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <filter id="bandera-suave" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <rect width="600" height="400" fill="#0a2d95" />
      <g filter="url(#bandera-suave)">
        <rect y="-20" width="600" height="100" fill="#0a2d95" />
        <rect y="80" width="600" height="80" fill="#ffffff" />
        <rect y="160" width="600" height="80" fill="#0a2d95" />
        <rect y="240" width="600" height="80" fill="#ffffff" />
        <rect y="320" width="600" height="100" fill="#0a2d95" />
        <path d="M-20 -20 300 200 -20 420z" fill="#d21034" />
        <path
          fill="#ffffff"
          d="m100 152 11.2 34.5h36.3l-29.4 21.3 11.2 34.5L100 221l-29.3 21.3 11.2-34.5-29.4-21.3h36.3z"
        />
      </g>
    </svg>
  )
}
