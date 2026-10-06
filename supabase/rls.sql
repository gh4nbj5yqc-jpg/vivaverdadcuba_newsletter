-- Activa RLS en las tablas de la newsletter y bloquea todo acceso con la clave anon.
-- Toda la app lee y escribe desde el servidor con la clave service_role, que se salta RLS,
-- asi que NO hace falta ninguna politica: sin politicas, anon y authenticated no pueden nada.
--
-- Ejecutar en Supabase > SQL Editor DESPUES de desplegar el codigo que usa
-- SUPABASE_SERVICE_ROLE_KEY (si no, el formulario de suscripcion deja de funcionar).

-- 1) Ver las politicas que existen ahora (para saber que se va a borrar)
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where (schemaname = 'public' and tablename in ('subscribers', 'editions'))
   or (schemaname = 'storage' and tablename = 'objects');

-- 2) Borrar todas las politicas de subscribers y editions
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('subscribers', 'editions')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 3) Activar RLS
alter table public.subscribers enable row level security;
alter table public.editions    enable row level security;

-- 4) Storage: quitar las politicas que dejaban subir/borrar/listar en el bucket.
--    El bucket sigue siendo publico para LEER las imagenes (los correos las necesitan),
--    pero subir solo es posible con la URL firmada que genera /api/upload-url.
--    Revisa el resultado del paso 1: si hay politicas en storage.objects que mencionen
--    'newsletter-images' (o que no filtren por bucket), borralas con:
--      drop policy "<nombre de la politica>" on storage.objects;

-- 5) Comprobacion: debe salir rowsecurity = true en ambas y ninguna politica
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('subscribers', 'editions');
select tablename, policyname from pg_policies
where schemaname = 'public' and tablename in ('subscribers', 'editions');
