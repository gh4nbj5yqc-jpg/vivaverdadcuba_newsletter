-- PASO 2 · ACTIVAR: borra los permisos de subscribers y editions y les pone el candado (RLS).
-- SI CAMBIA cosas. Ejecutalo solo despues del paso 1 y de guardar su resultado.

-- Por que es seguro: la web y el panel leen y escriben desde el servidor con la llave
-- secreta (service_role), que abre siempre. Solo se bloquea la llave publica (anon).
-- Si algo falla, ejecuta deshacer.sql y quita el candado al instante.

-- Borrar todos los permisos de las dos tablas.
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

-- Poner el candado.
alter table public.subscribers enable row level security;
alter table public.editions    enable row level security;
