-- Viva Verdad Cuba: noticias locales (Louisville; mas adelante Miami y Houston).
-- Se puede ejecutar varias veces sin romper nada.
-- NO toca las tablas de noticias (editions), suscriptores ni chat.
--
-- Ejecutar en Supabase > SQL Editor.

-- Van en una tabla aparte, y no en editions, a proposito:
--   * el codigo del correo solo lee editions, asi que una noticia local nunca puede enviarse por correo;
--   * una version anterior de la web (que no conoce las secciones) no las ve ni las mezcla con las generales.
create table if not exists public.noticias_locales (
  id uuid primary key default gen_random_uuid(),
  -- La ciudad. Por ahora solo se usa 'louisville'.
  seccion text not null check (seccion in ('louisville', 'miami', 'houston')),
  web_title text,
  web_cover_url text,
  -- Bloques del articulo (imagen / texto, en orden), igual que en editions.
  web_blocks jsonb not null default '[]'::jsonb,
  web_status text not null default 'borrador' check (web_status in ('borrador', 'publicada')),
  -- Fecha en que se publico por primera vez (no cambia al editar despues).
  web_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Para que /noticias?seccion=... liste rapido las publicadas, de la mas nueva a la mas vieja.
create index if not exists noticias_locales_publicadas_idx
  on public.noticias_locales (seccion, web_published_at desc)
  where web_status = 'publicada';

-- Candado: nadie puede leer ni escribir la tabla con la clave publica.
-- La web y el panel lo hacen desde el servidor (clave service_role), igual que con las noticias.
alter table public.noticias_locales enable row level security;

-- Comprobacion (el SQL Editor solo muestra el ultimo resultado, por eso es una sola consulta):
-- debe salir una fila con columnas = 9 y rls_activo = true.
select
  (select count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'noticias_locales') as columnas,
  relrowsecurity as rls_activo
from pg_class
where oid = 'public.noticias_locales'::regclass;
