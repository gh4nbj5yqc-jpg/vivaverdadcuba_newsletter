-- PASO 1 · MIRAR: muestra los permisos (politicas) actuales de las tablas y del almacen de imagenes.
-- Solo mira, NO cambia nada. Guarda una captura o copia del resultado antes de seguir.

-- Permisos de las tablas de suscriptores y noticias, y del almacen de imagenes.
-- "cmd" es lo que permite: SELECT = leer, INSERT = crear/subir, UPDATE = cambiar, DELETE = borrar.
select schemaname, tablename, policyname, cmd, roles, qual as condicion, with_check as condicion_al_escribir
from pg_policies
where (schemaname = 'public' and tablename in ('subscribers', 'editions'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- Estado del candado: rowsecurity = true (puesto) o false (quitado).
-- (Si quieres ver tambien esto, ejecuta esta consulta sola despues de la anterior.)
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' and tablename in ('subscribers', 'editions');
