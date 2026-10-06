-- PASO 3 · COMPROBAR: confirma que el candado (RLS) esta puesto y que no quedan permisos.
-- Solo mira, NO cambia nada.

-- Resultado esperado: una sola fila por tabla, con candado_puesto = true y permisos = 0.
select
  t.tablename as tabla,
  t.rowsecurity as candado_puesto,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = t.tablename) as permisos
from pg_tables t
where t.schemaname = 'public' and t.tablename in ('subscribers', 'editions')
order by t.tablename;

-- Despues, prueba en la web real: suscribete con un correo, entra en /admin,
-- guarda una noticia, mira el Historial y abre /noticias.
