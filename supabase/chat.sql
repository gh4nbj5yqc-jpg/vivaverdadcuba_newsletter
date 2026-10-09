-- Viva Verdad Cuba: tabla del chat anonimo. Se puede ejecutar varias veces sin romper nada.
-- No toca las tablas de noticias ni de suscriptores.
--
-- Ejecutar en Supabase > SQL Editor.

-- Un mensaje del chat. No guarda nombre, correo ni direccion de internet de nadie.
--   texto:  lo que escribio la persona (maximo 600 letras).
--   color:  el color de su bolita (uno, o dos separados por coma si la bolita es de dos colores).
--   autor:  huella de un codigo al azar que el navegador inventa en cada visita. Solo sirve para
--           saber que mensajes son de la misma visita (regla de los mensajes seguidos y color).
create table if not exists public.chat_mensajes (
  id uuid primary key default gen_random_uuid(),
  texto text not null check (char_length(texto) between 1 and 600),
  color text not null check (color ~ '^#[0-9a-f]{6}(,#[0-9a-f]{6})?$'),
  autor text not null check (char_length(autor) between 16 and 64),
  created_at timestamptz not null default now()
);

-- Para listar rapido los mensajes mas recientes y borrar los de mas de 3 dias.
create index if not exists chat_mensajes_fecha_idx on public.chat_mensajes (created_at desc);

-- Candado: nadie puede leer ni escribir la tabla directamente con la clave publica.
-- La web lo hace desde el servidor (clave service_role), igual que con las noticias.
alter table public.chat_mensajes enable row level security;

-- Comprobacion: debe listar las 5 columnas (id, texto, color, autor, created_at).
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'chat_mensajes'
order by ordinal_position;
