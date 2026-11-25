import { esFallaPendiente, type Equipo, type Reporte } from "./tipos";

export type Indicadores = {
  total: number;
  operativos: number;
  conFalla: number;
  mantenimiento: number;
  // Porcentaje de equipos disponibles para uso clinico (Operativo).
  disponibilidad: number | null;
  fallasPendientes: number;
  // Tiempo medio de reparacion (MTTR) de las fallas resueltas, en ms.
  mttr: number | null;
  fallasResueltas: number;
  // Falla pendiente mas antigua (para priorizar la atencion).
  fallaMasAntigua: { reporte: Reporte; equipo: Equipo | undefined } | null;
};

export function calcularIndicadores(equipos: Equipo[], reportes: Reporte[]): Indicadores {
  const total = equipos.length;
  const operativos = equipos.filter((e) => e.estado === "Operativo").length;
  const conFalla = equipos.filter((e) => e.estado === "Con falla").length;
  const mantenimiento = equipos.filter((e) => e.estado === "Mantenimiento").length;

  const pendientes = reportes
    .filter(esFallaPendiente)
    .sort((a, b) => a.creado_en.localeCompare(b.creado_en));

  const resueltas = reportes.filter(
    (r) => r.tipo === "Falla" && r.estado_atencion === "Resuelto" && r.resuelto_en
  );

  const mttr =
    resueltas.length === 0
      ? null
      : resueltas.reduce(
          (suma, r) =>
            suma + (new Date(r.resuelto_en!).getTime() - new Date(r.creado_en).getTime()),
          0
        ) / resueltas.length;

  const masAntigua = pendientes[0];

  return {
    total,
    operativos,
    conFalla,
    mantenimiento,
    disponibilidad: total === 0 ? null : Math.round((operativos / total) * 100),
    fallasPendientes: pendientes.length,
    mttr,
    fallasResueltas: resueltas.length,
    fallaMasAntigua: masAntigua
      ? { reporte: masAntigua, equipo: equipos.find((e) => e.id === masAntigua.equipo_id) }
      : null,
  };
}

// Numero de fallas pendientes por equipo.
export function pendientesPorEquipo(reportes: Reporte[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const r of reportes) {
    if (esFallaPendiente(r)) mapa.set(r.equipo_id, (mapa.get(r.equipo_id) ?? 0) + 1);
  }
  return mapa;
}
