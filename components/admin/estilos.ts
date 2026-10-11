// Clases compartidas del panel de admin. Mismo estilo que la web publica: letra del sistema,
// tarjetas blancas de esquinas amplias y botones en capsula. Los colores salen de app/globals.css,
// asi que el panel tambien se adapta solo al modo oscuro.
export const titular = 'tracking-[-0.02em]'
export const etiqueta = 'mb-1.5 block text-[0.8125rem] font-semibold text-tinta-2'
export const campo =
  'w-full min-h-12 rounded-xl bg-superficie px-3.5 py-2.5 text-[1.0625rem] text-tinta shadow-[inset_0_0_0_1px_var(--linea)] placeholder:text-tinta-3 focus:shadow-[inset_0_0_0_2px_var(--acento)] focus:outline-none disabled:opacity-60'

const boton =
  'inline-flex min-h-12 items-center justify-center rounded-full px-5 text-center text-base font-semibold leading-tight transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100'
export const botonPrimario = `${boton} bg-acento text-white hover:brightness-110`
export const botonSecundario = `${boton} bg-superficie text-tinta shadow-[inset_0_0_0_1px_var(--linea)] hover:bg-relleno`
export const botonPeligro =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-acento/12 px-4 text-[0.9375rem] font-semibold text-acento-tinta transition hover:bg-acento/20 active:scale-[0.98] disabled:opacity-50'
// El "Sí, eliminar" de las confirmaciones: rojo lleno, para que destaque sobre el aviso.
export const botonConfirmar =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-acento px-4 text-[0.9375rem] font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50'
// "Cancelar", "Seguir editando": una accion discreta, sin fondo.
export const botonDiscreto =
  'inline-flex min-h-11 items-center justify-center rounded-full px-3 text-[0.9375rem] font-semibold text-tinta-2 transition hover:text-tinta'
export const botonIcono =
  'flex h-10 w-10 items-center justify-center rounded-full bg-relleno text-lg text-tinta transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30'

export const avisoOk = 'rounded-2xl bg-[#34c759]/16 px-4 py-3 leading-snug'
export const avisoError = 'rounded-2xl bg-acento/12 px-4 py-3 leading-snug'
export const avisoAtencion = 'rounded-2xl bg-[#ff9f0a]/18 px-4 py-3 leading-snug'
// Texto de ayuda, en gris.
export const ayuda = 'text-[0.9375rem] leading-snug text-tinta-2'
// Verde de "hecho": publicada, enviado.
export const verde = 'text-[#1d8a3a] dark:text-[#30d158]'
