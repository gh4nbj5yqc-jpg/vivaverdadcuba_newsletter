-- Viva Verdad Cuba: correo y web por bloques. Se puede ejecutar varias veces.
-- No borra ni modifica columnas existentes, no activa RLS ni cambia politicas.

-- Bloques del correo (imagen / texto, en orden). NULL = edicion antigua (title/content/image_url).
alter table public.editions add column if not exists blocks jsonb;

-- Fecha en que Resend confirmo el envio del correo a todos los suscriptores.
alter table public.editions add column if not exists sent_at timestamptz;

-- Titular del articulo web.
alter table public.editions add column if not exists web_title text;

-- URL publica de la imagen de portada del articulo web.
alter table public.editions add column if not exists web_cover_url text;

-- Bloques del articulo web (imagen / texto, en orden). NULL = sin version web.
alter table public.editions add column if not exists web_blocks jsonb;

-- Estado de la version web; las filas que ya existen quedan como 'borrador' (no se publican).
alter table public.editions add column if not exists web_status text not null default 'borrador'
  check (web_status in ('borrador', 'publicada'));

-- Fecha en que se publico por primera vez en la web (no cambia al editar despues).
alter table public.editions add column if not exists web_published_at timestamptz;

-- Fecha de la ultima edicion de la noticia (correo o web).
alter table public.editions add column if not exists updated_at timestamptz not null default now();

-- Indice para que /noticias liste rapido los articulos publicados, del mas nuevo al mas viejo.
create index if not exists editions_web_publicadas_idx
  on public.editions (web_published_at desc)
  where web_status = 'publicada';

-- Comprobacion: debe listar las 8 columnas nuevas.
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'editions'
  and column_name in ('blocks','sent_at','web_title','web_cover_url','web_blocks',
                      'web_status','web_published_at','updated_at')
order by column_name;
