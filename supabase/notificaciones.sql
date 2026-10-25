-- Viva Verdad Cuba: quien activo las notificaciones de la app. Se puede ejecutar varias veces sin romper nada.
-- No toca las tablas de noticias, suscriptores ni chat.
--
-- Ejecutar en Supabase > SQL Editor.

-- Una fila por telefono u ordenador que activo las notificaciones. No guarda nombre ni correo:
--   endpoint:     la direccion que da el navegador (Apple, Google, Mozilla...) para mandarle avisos.
--   p256dh, auth: las claves del navegador para cifrar el aviso (solo ese navegador puede leerlo).
-- Si la persona las desactiva, o el navegador dice que la direccion ya no vale, la fila se borra.
create table if not exists public.notificaciones_suscripciones (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique check (char_length(endpoint) between 20 and 1000),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  created_at timestamptz not null default now()
);

-- Candado: nadie puede leer ni escribir la tabla directamente con la clave publica.
-- La web lo hace desde el servidor (clave service_role), igual que con los suscriptores.
alter table public.notificaciones_suscripciones enable row level security;

-- Comprobacion: debe salir una fila con columnas = 5 y rls_activo = true.
select
  (select count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'notificaciones_suscripciones') as columnas,
  relrowsecurity as rls_activo
from pg_class
where oid = 'public.notificaciones_suscripciones'::regclass;
