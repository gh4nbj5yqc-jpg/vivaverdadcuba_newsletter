// Limpia una clave de las notificaciones (VAPID) tal como llega de las variables de entorno.
// Al pegarlas en Vercel es facil que se cuelen espacios, saltos de linea o comillas, y con
// eso el navegador no puede leer la clave (en el iPhone: "InvalidCharacterError").
// Las claves y el contacto (mailto:...) nunca llevan esos caracteres, asi que se quitan todos.
// La usan el boton (components/BotonNotificaciones.tsx) y el servidor (lib/notificaciones.ts).
export function limpiarClave(valor: string | undefined) {
  return (valor ?? '').replace(/[\s"'`]/g, '')
}
