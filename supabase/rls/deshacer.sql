-- DESHACER: quita el candado (RLS) de subscribers y editions al instante, si algo deja de funcionar.
-- SI CAMBIA cosas: las tablas vuelven a quedar abiertas a la llave publica, como antes del paso 2.

-- Los permisos que borro el paso 2 no se recuperan con esto, pero con el candado quitado
-- no hacen falta: todo vuelve a funcionar como antes. Si los quieres recrear, usa la
-- captura que guardaste en el paso 1.
alter table public.subscribers disable row level security;
alter table public.editions    disable row level security;

-- Comprobacion: debe salir rowsecurity = false en ambas.
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('subscribers', 'editions');
