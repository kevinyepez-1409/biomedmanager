-- =====================================================================
-- BioMedManager - 001: ciclo de vida de las fallas (regla de dominio)
-- =====================================================================
-- Regla biomedica: un equipo con una falla sin resolver no puede figurar
-- como disponible para uso clinico.
--
--   1. Registrar una Falla pone el equipo en "Con falla".
--      Una Observacion no cambia el estado.
--   2. Un equipo no puede pasar a "Operativo" mientras tenga alguna Falla
--      Pendiente. Si puede pasar a "Mantenimiento" (lo estan reparando).
--   3. Resolver un reporte exige una nota de cierre (5-2000 caracteres);
--      la fecha de resolucion la pone la base de datos.
--   4. Un reporte resuelto no se puede modificar.
--   5. Resolver la ultima falla NO devuelve el equipo a "Operativo": el
--      tecnico lo hace a mano tras verificar el equipo.
--
-- La regla vive en PostgreSQL (triggers + permisos), no solo en la UI,
-- porque el navegador habla directo con la API de Supabase.
-- Ejecutar UNA vez en Supabase > SQL Editor. Es transaccional.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Reportes: datos de cierre
-- ---------------------------------------------------------------------
ALTER TABLE public.reportes
  ADD COLUMN nota_cierre TEXT,
  ADD COLUMN resuelto_en TIMESTAMPTZ;

ALTER TABLE public.reportes
  ADD CONSTRAINT reportes_cierre_check CHECK (
    (estado_atencion = 'Pendiente'
      AND nota_cierre IS NULL
      AND resuelto_en IS NULL)
    OR
    (estado_atencion = 'Resuelto'
      AND nota_cierre IS NOT NULL
      AND char_length(trim(nota_cierre)) BETWEEN 5 AND 2000
      AND resuelto_en IS NOT NULL)
  );

-- Equipos: marca y modelo tampoco pueden quedar vacios.
ALTER TABLE public.equipos
  ADD CONSTRAINT equipos_marca_check CHECK (length(trim(marca)) > 0),
  ADD CONSTRAINT equipos_modelo_check CHECK (length(trim(modelo)) > 0);

-- Indice para contar fallas pendientes por equipo.
CREATE INDEX reportes_fallas_pendientes_idx
ON public.reportes (equipo_id)
WHERE tipo = 'Falla' AND estado_atencion = 'Pendiente';


-- ---------------------------------------------------------------------
-- Permisos minimos
-- ---------------------------------------------------------------------
-- Equipos: antes se podia modificar cualquier columna (incluidas id,
-- usuario_id y creado_en). Ahora solo los datos descriptivos y el estado.
REVOKE UPDATE ON public.equipos FROM authenticated;
GRANT UPDATE (estado, nombre, marca, modelo, ubicacion)
ON public.equipos TO authenticated;

-- Reportes: se puede cambiar el estado de atencion y escribir la nota.
-- resuelto_en lo asigna el trigger.
GRANT UPDATE (estado_atencion, nota_cierre)
ON public.reportes TO authenticated;


-- ---------------------------------------------------------------------
-- Trigger: valores controlados al crear equipos y reportes
-- ---------------------------------------------------------------------
CREATE FUNCTION public.equipos_antes_de_insertar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- La fecha de alta no se puede falsear desde la API.
  NEW.creado_en := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER equipos_antes_de_insertar
BEFORE INSERT ON public.equipos
FOR EACH ROW EXECUTE FUNCTION public.equipos_antes_de_insertar();


CREATE FUNCTION public.reportes_antes_de_insertar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Todo reporte nace Pendiente, sin cierre y con la fecha real.
  NEW.estado_atencion := 'Pendiente';
  NEW.nota_cierre := NULL;
  NEW.resuelto_en := NULL;
  NEW.creado_en := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER reportes_antes_de_insertar
BEFORE INSERT ON public.reportes
FOR EACH ROW EXECUTE FUNCTION public.reportes_antes_de_insertar();


-- ---------------------------------------------------------------------
-- Trigger: una Falla nueva pone el equipo "Con falla"   (regla 1)
-- ---------------------------------------------------------------------
-- SECURITY INVOKER: actua con los permisos de quien reporta. La politica
-- de insercion ya garantiza que el equipo es suyo.
CREATE FUNCTION public.reportes_falla_marca_equipo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.tipo = 'Falla' THEN
    UPDATE public.equipos
    SET estado = 'Con falla'
    WHERE id = NEW.equipo_id
      AND estado <> 'Con falla';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reportes_falla_marca_equipo
AFTER INSERT ON public.reportes
FOR EACH ROW EXECUTE FUNCTION public.reportes_falla_marca_equipo();


-- ---------------------------------------------------------------------
-- Trigger: bloquear "Operativo" con fallas pendientes   (regla 2)
-- ---------------------------------------------------------------------
CREATE FUNCTION public.equipos_validar_estado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  pendientes integer;
BEGIN
  IF NEW.estado = 'Operativo' AND OLD.estado IS DISTINCT FROM 'Operativo' THEN
    SELECT count(*) INTO pendientes
    FROM public.reportes r
    WHERE r.equipo_id = NEW.id
      AND r.tipo = 'Falla'
      AND r.estado_atencion = 'Pendiente';

    IF pendientes > 0 THEN
      RAISE EXCEPTION 'EQUIPO_CON_FALLAS_PENDIENTES'
        USING ERRCODE = 'P0001',
              DETAIL = pendientes::text,
              HINT = 'Resuelva las fallas pendientes antes de marcar el equipo como Operativo.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER equipos_validar_estado
BEFORE UPDATE OF estado ON public.equipos
FOR EACH ROW EXECUTE FUNCTION public.equipos_validar_estado();


-- ---------------------------------------------------------------------
-- Trigger: cierre de reportes   (reglas 3 y 4)
-- ---------------------------------------------------------------------
CREATE FUNCTION public.reportes_validar_cierre()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.estado_atencion = 'Resuelto' THEN
    RAISE EXCEPTION 'REPORTE_YA_RESUELTO'
      USING ERRCODE = 'P0001',
            HINT = 'Un reporte resuelto no se puede modificar.';
  END IF;

  IF NEW.estado_atencion = 'Resuelto' THEN
    NEW.nota_cierre := trim(NEW.nota_cierre);
    NEW.resuelto_en := now();
  ELSE
    NEW.resuelto_en := NULL;
  END IF;

  -- Si falta la nota, la restriccion reportes_cierre_check lo rechaza.
  RETURN NEW;
END;
$$;

CREATE TRIGGER reportes_validar_cierre
BEFORE UPDATE ON public.reportes
FOR EACH ROW EXECUTE FUNCTION public.reportes_validar_cierre();

-- Las funciones de trigger no deben poder llamarse por /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION
  public.equipos_antes_de_insertar(),
  public.reportes_antes_de_insertar(),
  public.reportes_falla_marca_equipo(),
  public.equipos_validar_estado(),
  public.reportes_validar_cierre()
FROM PUBLIC, anon, authenticated;

COMMIT;
