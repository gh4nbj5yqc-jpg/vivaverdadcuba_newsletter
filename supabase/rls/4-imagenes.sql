-- PASO 4 · IMAGENES: lista los permisos del almacen de imagenes y prepara las ordenes para borrarlos.
-- Solo mira, NO cambia nada: tu copias y ejecutas a mano las ordenes que quieras borrar.

-- EN SIMPLE:
-- * Las fotos del bucket newsletter-images se pueden VER sin permisos (el bucket es publico).
--   Eso no cambia: la web y los correos las siguen mostrando.
-- * El panel SUBE las fotos con un enlace de un solo uso que le da tu servidor, asi que
--   tampoco necesita permisos publicos.
-- * Por eso, los permisos que dejan a cualquiera subir, cambiar, borrar o listar fotos en
--   newsletter-images sobran y conviene borrarlos.
-- * NO borres permisos de otros buckets.

-- A) Permisos que mencionan newsletter-images. La ultima columna es la orden lista para
--    copiar. Pega en el SQL Editor solo las ordenes de los que quieras borrar (normalmente
--    todos los de esta lista), ejecutalas y luego sube una foto desde el panel para comprobar.
select
  policyname as permiso,
  cmd as que_permite,
  format('drop policy %I on storage.objects;', policyname) as orden_para_borrarlo
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ilike '%newsletter-images%'
order by policyname;

-- B) Permisos de storage que NO mencionan ningun bucket concreto (afectan a todos).
--    NO los borres por tu cuenta: pasame esta lista y decidimos juntos.
--    (Ejecuta esta consulta sola, quitando los "--" del principio de cada linea.)
-- select policyname as permiso, cmd as que_permite, qual as condicion, with_check as condicion_al_escribir
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
--   and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) not ilike '%bucket_id%'
-- order by policyname;
