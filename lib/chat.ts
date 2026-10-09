// Reglas del chat, compartidas por el navegador y el servidor.
// No importa nada del servidor: se puede usar tambien en el navegador.

// Los mensajes duran 3 dias: despues dejan de mostrarse y se borran.
export const DIAS_CHAT = 3
// Largo maximo de un mensaje.
export const MAX_PALABRAS = 50
export const MAX_LETRAS = 600
// Una persona puede escribir 5 mensajes seguidos; cuando otra escribe, puede escribir 5 mas.
export const MAX_SEGUIDOS = 5
// Freno general contra programas que inundan el chat (entre todos los visitantes).
export const MAX_POR_MINUTO = 20
// Cuantos mensajes se muestran como maximo (los mas recientes).
export const MAX_EN_PANTALLA = 100

// Colores de las bolitas, por gamas. Se reparten en este orden:
//   1) primarios y secundarios;
//   2) si ya estan todos ocupados, otra gama de colores;
//   3) si tambien se acaban, bolitas de dos colores (mitad y mitad).
// Un color es "#rrggbb"; una bolita de dos colores es "#rrggbb,#rrggbb".
export const GAMA_1 = [
  '#e02020', // rojo
  '#1f4fd8', // azul
  '#f7d117', // amarillo
  '#f2801c', // naranja
  '#2e9e44', // verde
  '#7b2fbe', // morado
]
export const GAMA_2 = [
  '#17a2b8', // turquesa
  '#ff7aa8', // rosa
  '#9acd32', // lima
  '#8b5a2b', // marron
  '#7ec8f2', // celeste
  '#d81b9a', // magenta
  '#8c8c8c', // gris
  '#1a1a1a', // negro
]
// Todas las parejas de dos colores distintos de la primera gama (15 combinaciones).
export const GAMA_3 = GAMA_1.flatMap((a, i) => GAMA_1.slice(i + 1).map(b => `${a},${b}`))

export const GAMAS = [GAMA_1, GAMA_2, GAMA_3]
export const PALETA = GAMAS.flat()

// Lo que ve todo el mundo de un mensaje.
export type MensajeChat = { id: string; texto: string; color: string; created_at: string }
// Lo que usa el servidor para aplicar las reglas. "autor" nunca sale del servidor.
export type MensajeReciente = { autor: string; color: string; created_at: string }

export function contarPalabras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length
}

// Quita espacios sobrantes y no deja mas de una linea en blanco seguida.
export function limpiarTexto(texto: string) {
  return texto.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// Devuelve por que no se puede enviar el texto, o null si esta bien.
export function errorDeTexto(texto: string): string | null {
  if (!texto) return 'Escribe un mensaje.'
  const palabras = contarPalabras(texto)
  if (palabras > MAX_PALABRAS) return `El mensaje tiene ${palabras} palabras. El máximo es ${MAX_PALABRAS}.`
  if (texto.length > MAX_LETRAS) return `El mensaje es demasiado largo. El máximo es ${MAX_LETRAS} letras.`
  return null
}

// "recientes" va del mensaje mas nuevo al mas viejo.
export function llegoAlTopeSeguidos(recientes: { autor: string }[], autor: string) {
  return recientes.length >= MAX_SEGUIDOS && recientes.slice(0, MAX_SEGUIDOS).every(m => m.autor === autor)
}

const resto = (n: number, entre: number) => ((Math.trunc(n) % entre) + entre) % entre

// Un color que no este en "usados", de la primera gama que tenga alguno libre.
// Dentro de la gama empieza a buscar desde "inicio", para que no todos reciban el mismo.
// Si no queda ninguno libre en ninguna gama, se repite uno.
export function colorLibre(usados: Set<string>, inicio: number) {
  for (const gama of GAMAS) {
    const desde = resto(inicio, gama.length)
    for (let i = 0; i < gama.length; i++) {
      const c = gama[(desde + i) % gama.length]
      if (!usados.has(c)) return c
    }
  }
  return PALETA[resto(inicio, PALETA.length)]
}

// En que gama esta un color (0, 1 o 2), o -1 si no es de la paleta.
export function gamaDe(color: string) {
  return GAMAS.findIndex(g => g.includes(color))
}

// Numero fijo a partir de un texto, para que cada visitante empiece a buscar color en un sitio distinto.
export function numeroDe(texto: string) {
  let n = 0
  for (let i = 0; i < texto.length; i++) n = (n * 31 + texto.charCodeAt(i)) >>> 0
  return n
}

// Color de la bolita de quien escribe:
// - si ya escribio hace poco, conserva su color;
// - si es nuevo, recibe uno que no lleve nadie, de la primera gama con colores libres.
//   Se respeta el que ya le mostraba su navegador si sigue libre y es de esa misma gama.
export function colorPara(recientes: MensajeReciente[], autor: string, pedido: unknown) {
  const mio = recientes.find(m => m.autor === autor)
  if (mio) return mio.color
  const usados = new Set(recientes.map(m => m.color))
  const libre = colorLibre(usados, numeroDe(autor))
  if (typeof pedido === 'string' && !usados.has(pedido) && gamaDe(pedido) !== -1 && gamaDe(pedido) === gamaDe(libre)) {
    return pedido
  }
  return libre
}
