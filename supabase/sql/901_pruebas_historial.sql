-- =====================================================================
-- BioMedManager - 901: pruebas del historial de estados (002)
-- =====================================================================
-- Ejecutar en Supabase > SQL Editor DESPUES de 002_historial_estados.sql.
-- Igual que 900: simula usuarios reales, crea un equipo temporal y lo
-- borra al final (no deja datos). Resultado: tabla con OK / FALLO.
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
  equipo uuid;
  filas integer;
  origenes text;
  res text[] := '{}';
BEGIN
  SELECT id INTO usuario_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO usuario_b FROM auth.users WHERE id <> usuario_a ORDER BY created_at LIMIT 1;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', usuario_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- 1. El alta queda registrada.
  INSERT INTO public.equipos (codigo, nombre, marca, modelo, ubicacion, estado)
  VALUES ('PRUEBA-901', 'Equipo de prueba', 'Prueba', 'Prueba', 'Laboratorio', 'Operativo')
  RETURNING id INTO equipo;
  SELECT count(*) INTO filas FROM public.historial_estados
  WHERE equipo_id = equipo AND origen = 'Alta del equipo' AND estado_nuevo = 'Operativo';
  res := res || format('1|Alta registrada en el historial|%s',
    CASE WHEN filas = 1 THEN 'OK' ELSE 'FALLO: ' || filas || ' filas' END);

  -- 2. Una Falla registra el cambio con origen "Falla reportada".
  INSERT INTO public.reportes (equipo_id, tipo, descripcion)
  VALUES (equipo, 'Falla', 'Falla de prueba del historial');
  SELECT count(*) INTO filas FROM public.historial_estados
  WHERE equipo_id = equipo AND origen = 'Falla reportada'
    AND estado_anterior = 'Operativo' AND estado_nuevo = 'Con falla';
  res := res || format('2|Falla: cambio registrado como "Falla reportada"|%s',
    CASE WHEN filas = 1 THEN 'OK' ELSE 'FALLO: ' || filas || ' filas' END);

  -- 3. Un cambio desde la ficha queda como "Cambio manual".
  UPDATE public.equipos SET estado = 'Mantenimiento' WHERE id = equipo;
  SELECT count(*) INTO filas FROM public.historial_estados
  WHERE equipo_id = equipo AND origen = 'Cambio manual'
    AND estado_anterior = 'Con falla' AND estado_nuevo = 'Mantenimiento';
  res := res || format('3|Cambio manual registrado|%s',
    CASE WHEN filas = 1 THEN 'OK' ELSE 'FALLO: ' || filas || ' filas' END);

  -- 4. Editar otros datos no crea entradas.
  UPDATE public.equipos SET ubicacion = 'Laboratorio 2' WHERE id = equipo;
  SELECT count(*), string_agg(origen, ', ' ORDER BY creado_en) INTO filas, origenes
  FROM public.historial_estados WHERE equipo_id = equipo;
  res := res || format('4|Editar datos no agrega entradas (3 en total)|%s',
    CASE WHEN filas = 3 THEN 'OK' ELSE 'FALLO: ' || filas || ' (' || origenes || ')' END);

  -- 5. Nadie puede escribir el historial desde la API.
  BEGIN
    INSERT INTO public.historial_estados (equipo_id, usuario_id, estado_nuevo, origen)
    VALUES (equipo, usuario_a, 'Operativo', 'Cambio manual');
    res := res || '5|Insertar historial a mano: sin permiso|FALLO: se permitió'::text;
  EXCEPTION WHEN insufficient_privilege THEN
    res := res || '5|Insertar historial a mano: sin permiso|OK'::text;
  WHEN OTHERS THEN
    res := res || format('5|Insertar historial a mano: sin permiso|FALLO: %s', SQLERRM);
  END;

  -- 6. Otra cuenta no ve este historial.
  IF usuario_b IS NULL THEN
    res := res || '6|Cuenta B no ve el historial de A|OMITIDO: solo hay una cuenta'::text;
  ELSE
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', usuario_b, 'role', 'authenticated')::text, true);
    SELECT count(*) INTO filas FROM public.historial_estados WHERE equipo_id = equipo;
    res := res || format('6|Cuenta B no ve el historial de A|%s',
      CASE WHEN filas = 0 THEN 'OK' ELSE 'FALLO: ve ' || filas END);
  END IF;

  -- Limpieza como administrador.
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM public.reportes WHERE equipo_id = equipo;
  DELETE FROM public.historial_estados WHERE equipo_id = equipo;
  DELETE FROM public.equipos WHERE id = equipo;

  INSERT INTO resultados_pruebas (n, caso, resultado)
  SELECT split_part(x, '|', 1)::integer, split_part(x, '|', 2), split_part(x, '|', 3)
  FROM unnest(res) AS x;
END;
$$;

SELECT n AS "#", caso, resultado FROM resultados_pruebas ORDER BY n;
