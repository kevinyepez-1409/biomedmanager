-- =====================================================================
-- BioMedManager - 002: trazabilidad de los cambios de estado
-- =====================================================================
-- Registra automaticamente cada cambio de estado de un equipo (y su alta):
-- estado anterior, estado nuevo, origen del cambio y fecha. La tabla solo
-- la escribe la base de datos (trigger); desde la API solo se puede leer,
-- y cada cuenta ve unicamente el historial de sus equipos.
--
-- Origen:
--   'Alta del equipo'   -> al registrar el equipo
--   'Falla reportada'   -> cambio automatico al reportar una Falla (regla 1)
--   'Cambio manual'     -> el responsable cambio el estado desde la ficha
--
-- Ejecutar UNA vez en Supabase > SQL Editor, despues de 001. Transaccional.
-- =====================================================================

BEGIN;

CREATE TABLE public.historial_estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  equipo_id UUID NOT NULL
    REFERENCES public.equipos(id)
    ON DELETE RESTRICT,

  usuario_id UUID NOT NULL
    REFERENCES auth.users(id),

  estado_anterior TEXT
    CHECK (estado_anterior IN ('Operativo', 'Con falla', 'Mantenimiento')),

  estado_nuevo TEXT NOT NULL
    CHECK (estado_nuevo IN ('Operativo', 'Con falla', 'Mantenimiento')),

  origen TEXT NOT NULL
    CHECK (origen IN ('Alta del equipo', 'Falla reportada', 'Cambio manual', 'Inicio del historial')),

  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX historial_estados_equipo_fecha_idx
ON public.historial_estados (equipo_id, creado_en DESC);

ALTER TABLE public.historial_estados ENABLE ROW LEVEL SECURITY;

-- Solo lectura desde la API; no hay INSERT/UPDATE/DELETE para usuarios.
REVOKE ALL ON public.historial_estados FROM anon, authenticated;
GRANT SELECT ON public.historial_estados TO authenticated;

CREATE POLICY "Leer historial de estados propio"
ON public.historial_estados
FOR SELECT TO authenticated
USING (usuario_id = (SELECT auth.uid()));


-- ---------------------------------------------------------------------
-- Trigger que escribe el historial
-- ---------------------------------------------------------------------
-- SECURITY DEFINER: los usuarios no tienen permiso de INSERT en la tabla;
-- solo esta funcion (disparada por la base de datos) puede escribir.
-- El usuario_id se toma del propio equipo, no del cliente.
CREATE FUNCTION public.equipos_registrar_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historial_estados (equipo_id, usuario_id, estado_anterior, estado_nuevo, origen)
    VALUES (NEW.id, NEW.usuario_id, NULL, NEW.estado, 'Alta del equipo');
  ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.historial_estados (equipo_id, usuario_id, estado_anterior, estado_nuevo, origen)
    VALUES (
      NEW.id,
      NEW.usuario_id,
      OLD.estado,
      NEW.estado,
      coalesce(nullif(current_setting('biomed.origen_estado', true), ''), 'Cambio manual')
    );
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER equipos_registrar_estado
AFTER INSERT OR UPDATE OF estado ON public.equipos
FOR EACH ROW EXECUTE FUNCTION public.equipos_registrar_estado();


-- La regla 1 (Falla -> "Con falla") marca el origen del cambio para el
-- historial. Misma logica que en 001; solo se agrega la marca.
CREATE OR REPLACE FUNCTION public.reportes_falla_marca_equipo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.tipo = 'Falla' THEN
    PERFORM set_config('biomed.origen_estado', 'Falla reportada', true);
    UPDATE public.equipos
    SET estado = 'Con falla'
    WHERE id = NEW.equipo_id
      AND estado <> 'Con falla';
    PERFORM set_config('biomed.origen_estado', '', true);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION
  public.equipos_registrar_estado(),
  public.reportes_falla_marca_equipo()
FROM PUBLIC, anon, authenticated;


-- Punto de partida para los equipos que ya existian.
INSERT INTO public.historial_estados (equipo_id, usuario_id, estado_anterior, estado_nuevo, origen)
SELECT id, usuario_id, NULL, estado, 'Inicio del historial'
FROM public.equipos;

COMMIT;
