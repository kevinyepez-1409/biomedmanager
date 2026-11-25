// Tipos y constantes del dominio, alineados con supabase/sql/.

export const ESTADOS_EQUIPO = ["Operativo", "Con falla", "Mantenimiento"] as const;
export type EstadoEquipo = (typeof ESTADOS_EQUIPO)[number];

// "Con falla" solo lo asigna la base de datos al reportar una Falla.
export const ESTADOS_ELEGIBLES: EstadoEquipo[] = ["Operativo", "Mantenimiento"];

export const TIPOS_REPORTE = ["Falla", "Observación"] as const;
export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export type EstadoAtencion = "Pendiente" | "Resuelto";

export type Equipo = {
  id: string;
  codigo: string;
  nombre: string;
  marca: string;
  modelo: string;
  ubicacion: string;
  estado: EstadoEquipo;
  creado_en: string;
};

export type Reporte = {
  id: string;
  equipo_id: string;
  tipo: TipoReporte;
  descripcion: string;
  estado_atencion: EstadoAtencion;
  nota_cierre: string | null;
  resuelto_en: string | null;
  creado_en: string;
};

export const COLUMNAS_EQUIPO =
  "id,codigo,nombre,marca,modelo,ubicacion,estado,creado_en";

export const COLUMNAS_REPORTE =
  "id,equipo_id,tipo,descripcion,estado_atencion,nota_cierre,resuelto_en,creado_en";

export const LONGITUD_TEXTO = { min: 5, max: 2000 } as const;

export function esFallaPendiente(r: Pick<Reporte, "tipo" | "estado_atencion">) {
  return r.tipo === "Falla" && r.estado_atencion === "Pendiente";
}
