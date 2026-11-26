-- =====================================================================
-- BioMedManager - 900: pruebas de la regla de fallas y de RLS
-- =====================================================================
-- Ejecutar en Supabase > SQL Editor DESPUES de 001_regla_fallas.sql.
-- Simula dos usuarios reales (los dos primeros de auth.users) con el rol
-- `authenticated`, igual que la API. Crea un equipo de prueba temporal y
-- lo BORRA al final: no deja datos. Si algo inesperado falla, el bloque
-- completo se deshace.
-- Resultado: una tabla con cada caso y OK / FALLO.
-- =====================================================================

CREATE TEMP TABLE IF NOT EXISTS resultados_pruebas (
  n integer,
  caso text,
  resultado text
);
TRUNCATE resultados_pruebas;

DO $$
DECLARE
  usuario_a uuid;
  usuario_b uuid;
  claims_a text;
  claims_b text;
  equipo uuid;
  falla uuid;
  otro uuid;
  estado_actual text;
  atencion text;
  fecha timestamptz;
  filas integer;
  res text[] := '{}';
BEGIN
  SELECT id INTO usuario_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO usuario_b FROM auth.users WHERE id <> usuario_a ORDER BY created_at LIMIT 1;
  claims_a := json_build_object('sub', usuario_a, 'role', 'authenticated')::text;
  claims_b := json_build_object('sub', usuario_b, 'role', 'authenticated')::text;

  -- Actuar como la cuenta A.
  PERFORM set_config('request.jwt.claims', claims_a, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  INSERT INTO public.equipos (codigo, nombre, marca, modelo, ubicacion, estado)
  VALUES ('PRUEBA-900', 'Equipo de prueba', 'Prueba', 'Prueba', 'Laboratorio', 'Operativo')
  RETURNING id INTO equipo;

  -- 1. Una Observacion no cambia el estado.
  INSERT INTO public.reportes (equipo_id, tipo, descripcion)
  VALUES (equipo, 'Observación', 'Observación de prueba automática');
  SELECT estado INTO estado_actual FROM public.equipos WHERE id = equipo;
  res := res || format('1|Observación: el equipo sigue Operativo|%s',
    CASE WHEN estado_actual = 'Operativo' THEN 'OK' ELSE 'FALLO: ' || estado_actual END);

  -- 2. Una Falla pone el equipo "Con falla".
  INSERT INTO public.reportes (equipo_id, tipo, descripcion)
  VALUES (equipo, 'Falla', 'Falla de prueba automática')
  RETURNING id INTO falla;
  SELECT estado INTO estado_actual FROM public.equipos WHERE id = equipo;
  res := res || format('2|Falla: el equipo pasa a Con falla|%s',
    CASE WHEN estado_actual = 'Con falla' THEN 'OK' ELSE 'FALLO: ' || estado_actual END);

  -- 3/4. Con una falla pendiente no se puede marcar Operativo (llamada directa).
  BEGIN
    UPDATE public.equipos SET estado = 'Operativo' WHERE id = equipo;
    res := res || '3|Falla pendiente: Operativo bloqueado|FALLO: se permitió'::text;
  EXCEPTION WHEN OTHERS THEN
    res := res || format('3|Falla pendiente: Operativo bloqueado|%s',
      CASE WHEN SQLERRM = 'EQUIPO_CON_FALLAS_PENDIENTES' THEN 'OK' ELSE 'FALLO: ' || SQLERRM END);
  END;

  -- 5. Con una falla pendiente si se puede pasar a Mantenimiento.
  BEGIN
    UPDATE public.equipos SET estado = 'Mantenimiento' WHERE id = equipo;
    SELECT estado INTO estado_actual FROM public.equipos WHERE id = equipo;
    res := res || format('5|Falla pendiente: Mantenimiento permitido|%s',
      CASE WHEN estado_actual = 'Mantenimiento' THEN 'OK' ELSE 'FALLO: ' || estado_actual END);
  EXCEPTION WHEN OTHERS THEN
    res := res || format('5|Falla pendiente: Mantenimiento permitido|FALLO: %s', SQLERRM);
  END;

  -- 6. Resolver sin nota de cierre se rechaza.
  BEGIN
    UPDATE public.reportes SET estado_atencion = 'Resuelto' WHERE id = falla;
    res := res || '6|Resolver sin nota: rechazado|FALLO: se permitió'::text;
  EXCEPTION WHEN check_violation THEN
    res := res || '6|Resolver sin nota: rechazado|OK'::text;
  WHEN OTHERS THEN
    res := res || format('6|Resolver sin nota: rechazado|FALLO: %s', SQLERRM);
  END;

  -- 7. Resolver con nota: fecha automatica; despues Operativo se permite.
  BEGIN
    UPDATE public.reportes
    SET estado_atencion = 'Resuelto', nota_cierre = 'Se reemplazó el cable de alimentación'
    WHERE id = falla;
    SELECT resuelto_en INTO fecha FROM public.reportes WHERE id = falla;
    UPDATE public.equipos SET estado = 'Operativo' WHERE id = equipo;
    SELECT estado INTO estado_actual FROM public.equipos WHERE id = equipo;
    res := res || format('7|Resolver con nota y volver a Operativo|%s',
      CASE WHEN fecha IS NOT NULL AND estado_actual = 'Operativo' THEN 'OK'
           ELSE 'FALLO: resuelto_en=' || coalesce(fecha::text, 'NULL') || ', estado=' || estado_actual END);
  EXCEPTION WHEN OTHERS THEN
    res := res || format('7|Resolver con nota y volver a Operativo|FALLO: %s', SQLERRM);
  END;

  -- 8. Un reporte resuelto no se puede modificar.
  BEGIN
    UPDATE public.reportes SET nota_cierre = 'Texto cambiado después' WHERE id = falla;
    res := res || '8|Reporte resuelto: no modificable|FALLO: se permitió'::text;
  EXCEPTION WHEN OTHERS THEN
    res := res || format('8|Reporte resuelto: no modificable|%s',
      CASE WHEN SQLERRM = 'REPORTE_YA_RESUELTO' THEN 'OK' ELSE 'FALLO: ' || SQLERRM END);
  END;

  -- 9. Un reporte siempre nace Pendiente aunque se envie "Resuelto".
  BEGIN
    INSERT INTO public.reportes (equipo_id, tipo, descripcion, estado_atencion)
    VALUES (equipo, 'Observación', 'Intento de reporte ya resuelto', 'Resuelto')
    RETURNING id, estado_atencion INTO otro, atencion;
    res := res || format('9|Reporte nuevo siempre Pendiente|%s',
      CASE WHEN atencion = 'Pendiente' THEN 'OK' ELSE 'FALLO: ' || atencion END);
  EXCEPTION WHEN OTHERS THEN
    res := res || format('9|Reporte nuevo siempre Pendiente|FALLO: %s', SQLERRM);
  END;

  -- 10. No se puede falsear la fecha de alta de un equipo.
  BEGIN
    UPDATE public.equipos SET creado_en = now() - interval '1 year' WHERE id = equipo;
    res := res || '10|Cambiar creado_en: sin permiso|FALLO: se permitió'::text;
  EXCEPTION WHEN insufficient_privilege THEN
    res := res || '10|Cambiar creado_en: sin permiso|OK'::text;
  WHEN OTHERS THEN
    res := res || format('10|Cambiar creado_en: sin permiso|FALLO: %s', SQLERRM);
  END;

  -- 11-13. Aislamiento entre cuentas (RLS), actuando como la cuenta B.
  IF usuario_b IS NULL THEN
    res := res || '11|Cuenta B: pruebas de RLS|OMITIDO: solo hay una cuenta'::text;
  ELSE
    PERFORM set_config('request.jwt.claims', claims_b, true);

    SELECT count(*) INTO filas FROM public.equipos WHERE id = equipo;
    res := res || format('11|Cuenta B no ve el equipo de A|%s',
      CASE WHEN filas = 0 THEN 'OK' ELSE 'FALLO: lo ve' END);

    UPDATE public.equipos SET ubicacion = 'Cambiada por B' WHERE id = equipo;
    GET DIAGNOSTICS filas = ROW_COUNT;
    res := res || format('12|Cuenta B no modifica el equipo de A|%s',
      CASE WHEN filas = 0 THEN 'OK' ELSE 'FALLO: modificó ' || filas END);

    BEGIN
      INSERT INTO public.reportes (equipo_id, tipo, descripcion)
      VALUES (equipo, 'Falla', 'Reporte de B sobre equipo de A');
      res := res || '13|Cuenta B no reporta sobre equipo de A|FALLO: se permitió'::text;
    EXCEPTION WHEN insufficient_privilege THEN
      res := res || '13|Cuenta B no reporta sobre equipo de A|OK'::text;
    WHEN OTHERS THEN
      res := res || format('13|Cuenta B no reporta sobre equipo de A|FALLO: %s', SQLERRM);
    END;
  END IF;

  -- Limpieza como administrador: no queda ningun dato de prueba.
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM public.reportes WHERE equipo_id = equipo;
  IF to_regclass('public.historial_estados') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.historial_estados WHERE equipo_id = $1' USING equipo;
  END IF;
  DELETE FROM public.equipos WHERE id = equipo;

  INSERT INTO resultados_pruebas (n, caso, resultado)
  SELECT split_part(x, '|', 1)::integer, split_part(x, '|', 2), split_part(x, '|', 3)
  FROM unnest(res) AS x;
END;
$$;

SELECT n AS "#", caso, resultado FROM resultados_pruebas ORDER BY n;
