// La bolita de color que distingue a cada persona en el chat.
// "color" es un color ("#rrggbb") o dos separados por coma: entonces la bolita va mitad y mitad.
export default function Bolita({ color, className = '' }: { color: string; className?: string }) {
  const [uno, dos] = color.split(',')
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_var(--tinta-3)] ${className}`}
      style={{ background: dos ? `linear-gradient(90deg, ${uno} 50%, ${dos} 50%)` : uno }}
    />
  )
}
