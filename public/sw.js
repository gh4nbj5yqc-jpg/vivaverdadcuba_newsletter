// Service worker de Viva Verdad Cuba. Solo se encarga de las notificaciones:
// muestra el aviso de una noticia nueva y, al tocarlo, abre esa noticia en la app.
// No guarda la web para verla sin conexion. Lo registra components/BotonNotificaciones.tsx.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

// Lo que manda el servidor (lib/notificaciones.ts): titulo, texto, imagen, url y etiqueta.
self.addEventListener('push', event => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch {
    // Aviso sin datos legibles: se muestra uno generico.
  }

  const opciones = {
    body: datos.texto || 'Hay una noticia nueva.',
    icon: '/iconos/icono-192.png',
    data: { url: datos.url || '/noticias' },
  }
  // La portada sale grande en Android y en el ordenador; el iPhone no la muestra.
  if (datos.imagen) opciones.image = datos.imagen
  if (datos.etiqueta) opciones.tag = datos.etiqueta

  event.waitUntil(self.registration.showNotification(datos.titulo || 'Viva Verdad Cuba', opciones))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  // Solo se abren paginas de esta misma web.
  const ruta = event.notification.data && event.notification.data.url
  const url = new URL(typeof ruta === 'string' && ruta.startsWith('/') ? ruta : '/noticias', self.location.origin).href

  event.waitUntil(
    (async () => {
      // Si la app ya esta abierta, se trae al frente y se lleva a la noticia; si no, se abre.
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const ventana of ventanas) {
        if (new URL(ventana.url).origin !== self.location.origin) continue
        let abierta = null
        try {
          abierta = await ventana.navigate(url)
        } catch {
          // Esa ventana no se deja llevar a otra pagina: se prueba con la siguiente.
        }
        if (abierta) {
          await abierta.focus().catch(() => {})
          return
        }
      }
      await self.clients.openWindow(url)
    })()
  )
})
