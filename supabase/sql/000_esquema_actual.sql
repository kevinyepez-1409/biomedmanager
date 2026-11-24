-- =====================================================================
-- BioMedManager - Esquema de base de datos (estado al 2026-11-23)
-- =====================================================================
-- Reconstruido a partir del catalogo de PostgreSQL del proyecto Supabase
-- (consulta: supabase/sql/consultas/inspeccion_esquema.sql) y del script
-- original de creacion de la tabla `reportes`.
--
-- PROPOSITO: documentar y poder recrear el esquema en un proyecto NUEVO.
-- NO ejecutar sobre la base de datos actual: las tablas ya existen.
--
-- Nota: el orden de las columnas de `equipos` es aproximado (el catalogo
-- se consulto en orden alfabetico); tipos, valores por defecto,
-- restricciones, indices, permisos y politicas coinciden con lo real.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Tabla: equipos (inventario de equipos biomedicos, uno por usuario)
-- ---------------------------------------------------------------------
CREATE TABLE public.equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  usuario_id UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id),

  codigo TEXT NOT NULL
    CHECK (length(trim(codigo)) > 0),

  nombre TEXT NOT NULL
    CHECK (length(trim(nombre)) > 0),

  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,

  ubicacion TEXT NOT NULL
    CHECK (length(trim(ubicacion)) > 0),

  estado TEXT NOT NULL DEFAULT 'Operativo'
    CHECK (estado IN ('Operativo', 'Con falla', 'Mantenimiento')),

  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Codigo unico por usuario, sin distinguir mayusculas ni espacios extremos.
CREATE UNIQUE INDEX equipos_codigo_unico
ON public.equipos (usuario_id, lower(trim(codigo)));

ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.equipos FROM anon, authenticated;
-- Sin permiso DELETE: los equipos no se pueden borrar desde la API.
GRANT SELECT, INSERT, UPDATE ON public.equipos TO authenticated;

CREATE POLICY "Leer equipos propios"
ON public.equipos
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "Registrar equipos propios"
ON public.equipos
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "Actualizar equipos propios"
ON public.equipos
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = usuario_id)
WITH CHECK ((SELECT auth.uid()) = usuario_id);


-- ---------------------------------------------------------------------
-- Tabla: reportes (fallas y observaciones de cada equipo)
-- ---------------------------------------------------------------------
CREATE TABLE public.reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  equipo_id UUID NOT NULL
    REFERENCES public.equipos(id)
    ON DELETE RESTRICT,

  usuario_id UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id),

  tipo TEXT NOT NULL
    CHECK (tipo IN ('Falla', 'Observación')),

  descripcion TEXT NOT NULL
    CHECK (char_length(trim(descripcion)) BETWEEN 5 AND 2000),

  estado_atencion TEXT NOT NULL DEFAULT 'Pendiente'
    CHECK (estado_atencion IN ('Pendiente', 'Resuelto')),

  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial por equipo, del mas reciente al mas antiguo.
CREATE INDEX reportes_equipo_fecha_idx
ON public.reportes (equipo_id, creado_en DESC);

ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.reportes FROM anon, authenticated;
-- Sin DELETE; UPDATE solo sobre estado_atencion (no se puede cambiar
-- equipo_id, usuario_id, tipo ni descripcion de un reporte).
GRANT SELECT, INSERT ON public.reportes TO authenticated;
GRANT UPDATE (estado_atencion) ON public.reportes TO authenticated;

CREATE POLICY "Leer reportes propios"
ON public.reportes
FOR SELECT TO authenticated
USING (usuario_id = (SELECT auth.uid()));

-- Solo se puede reportar sobre equipos propios.
CREATE POLICY "Registrar reportes propios"
ON public.reportes
FOR INSERT TO authenticated
WITH CHECK (
  usuario_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.equipos e
    WHERE e.id = equipo_id
      AND e.usuario_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Actualizar estado de reportes propios"
ON public.reportes
FOR UPDATE TO authenticated
USING (usuario_id = (SELECT auth.uid()))
WITH CHECK (usuario_id = (SELECT auth.uid()));


-- ---------------------------------------------------------------------
-- Otros objetos encontrados en el esquema public
-- ---------------------------------------------------------------------
-- public.rls_auto_enable(): funcion SECURITY DEFINER no creada por este
-- proyecto; probablemente la agrega Supabase para activar RLS en tablas
-- nuevas. Pendiente de confirmar con el Security Advisor del panel.
--
-- No existen triggers en el esquema public (2026-11-23).
