// Genera los iconos de la app (PWA) a partir de scripts/icono.png (cuadrado, 1024x1024).
// Se guardan en public/iconos/ (Android) y en app/apple-icon.png (el del iPhone).
//
// Solo hace falta repetirlo si cambia el icono (reemplaza scripts/icono.png y ejecuta):
//   npx --yes tsx scripts/generar-iconos.ts
import { mkdirSync } from 'fs'
import sharp from 'sharp'

const ORIGINAL = 'scripts/icono.png'

// En los "maskable" Android recorta el icono en circulo, gota o cuadrado redondeado, y solo
// garantiza el circulo central del 80%. Las letras del icono llegan casi a las esquinas, asi
// que el diseno se achica hasta que entra entero en ese circulo.
const ESCALA_MASKABLE = 0.64

function normal(lado: number, destino: string) {
  return sharp(ORIGINAL).resize(lado, lado).png().toFile(destino)
}

async function maskable(lado: number, destino: string) {
  const interior = Math.round(lado * ESCALA_MASKABLE)
  const antes = Math.floor((lado - interior) / 2)
  const despues = lado - interior - antes
  const diseno = await sharp(ORIGINAL).resize(interior, interior).toBuffer()
  // El margen se rellena alargando el borde del propio icono (su fondo oscuro y sus franjas),
  // para que no se note donde termina el diseno.
  await sharp(diseno)
    .extend({ top: antes, bottom: despues, left: antes, right: despues, extendWith: 'copy' })
    .png()
    .toFile(destino)
}

async function main() {
  mkdirSync('public/iconos', { recursive: true })

  // Android (y Chrome en el ordenador): 192 y 512, normales y "maskable".
  for (const lado of [192, 512]) {
    await normal(lado, `public/iconos/icono-${lado}.png`)
    await maskable(lado, `public/iconos/icono-maskable-${lado}.png`)
  }
  // iPhone: 180x180, el tamano que pide para la pantalla de inicio. iOS le pone las esquinas redondas.
  await normal(180, 'app/apple-icon.png')

  console.log('Iconos generados en public/iconos/ y app/apple-icon.png')
}

main()
