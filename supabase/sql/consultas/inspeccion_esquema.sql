-- Consulta de SOLO LECTURA para inspeccionar el esquema real.
-- Ejecutar en Supabase > SQL Editor. No muestra datos ni credenciales.
-- Resultado: columnas, restricciones, indices, RLS, politicas, triggers,
-- permisos (tabla y UPDATE por columna) y funciones del esquema public.

select 'columna'::text as tipo, c.table_name::text as tabla, c.column_name::text as nombre,
       (c.data_type || ' | null=' || c.is_nullable || ' | default=' || coalesce(c.column_default,'-'))::text as detalle
from information_schema.columns c
where c.table_schema='public' and c.table_name in ('equipos','reportes')
union all
select 'restriccion', conrelid::regclass::text, conname::text, pg_get_constraintdef(oid)
from pg_constraint where conrelid in ('public.equipos'::regclass,'public.reportes'::regclass)
union all
select 'indice', tablename::text, indexname::text, indexdef
from pg_indexes where schemaname='public' and tablename in ('equipos','reportes')
union all
select 'rls', relname::text, ('enabled=' || relrowsecurity)::text, ('forced=' || relforcerowsecurity)::text
from pg_class where oid in ('public.equipos'::regclass,'public.reportes'::regclass)
union all
select 'politica', tablename::text, policyname::text,
       (cmd || ' | roles=' || array_to_string(roles, ',') || ' | using=' || coalesce(qual,'-') || ' | check=' || coalesce(with_check,'-'))::text
from pg_policies where schemaname='public'
union all
select 'trigger', event_object_table::text, trigger_name::text,
       (action_timing || ' ' || event_manipulation || ' | ' || action_statement)::text
from information_schema.triggers where event_object_schema='public'
union all
select 'permiso', table_name::text, grantee::text, string_agg(privilege_type::text, ',')
from information_schema.role_table_grants
where table_schema='public' and table_name in ('equipos','reportes') and grantee in ('anon','authenticated')
group by table_name, grantee
union all
select 'permiso_update_columna', table_name::text, grantee::text, string_agg(column_name::text, ',')
from information_schema.column_privileges
where table_schema='public' and table_name in ('equipos','reportes')
  and grantee in ('anon','authenticated') and privilege_type='UPDATE'
group by table_name, grantee
union all
select 'funcion', 'public', p.proname::text, ('security_definer=' || p.prosecdef)::text
from pg_proc p where p.pronamespace = 'public'::regnamespace
order by 1, 2, 3;
