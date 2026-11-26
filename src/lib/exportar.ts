// Exporta el inventario a un archivo Excel (.xlsx) en el navegador.
// Usa solo los datos que la cuenta ya puede leer (RLS); no hay backend.

import type { Cell, CellObject, Row, Sheet } from "write-excel-file/browser";
import { calcularIndicadores, pendientesPorEquipo } from "./indicadores";
import { duracion } from "./formato";
import type { CambioEstado, Equipo, Reporte } from "./tipos";

const FORMATO_FECHA = "dd/mm/yyyy hh:mm";
const AZUL = "#0F4C5C";

function encabezado(textos: string[]): Row {
  return textos.map((value) => ({
    value,
    fontWeight: "bold",
    textColor: "#FFFFFF",
    backgroundColor: AZUL,
    alignVertical: "center",
    height: 22,
  }));
}

function texto(
  value: string | null | undefined,
  extra: Omit<CellObject, "value" | "type"> = {}
): Cell {
  return value ? { value, type: String, ...extra } : null;
}

function fechaCelda(iso: string | null): Cell {
  return iso ? { value: new Date(iso), type: Date, format: FORMATO_FECHA } : null;
}

export async function exportarInventarioExcel(
  equipos: Equipo[],
  reportes: Reporte[],
  cambios: CambioEstado[] = []
) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const pendientes = pendientesPorEquipo(reportes);
  const porId = new Map(equipos.map((e) => [e.id, e]));
  const ind = calcularIndicadores(equipos, reportes);
  const ahora = new Date();

  // Hoja 1: resumen con indicadores.
  const resumen: Row[] = [
    [{ value: "BioMedManager - Resumen del inventario", fontWeight: "bold", fontSize: 14 }],
    [{ value: "Generado", fontWeight: "bold" }, { value: ahora, type: Date, format: FORMATO_FECHA }],
    [],
    encabezado(["Indicador", "Valor"]),
    ["Total de equipos", ind.total],
    ["Operativos", ind.operativos],
    ["Con falla", ind.conFalla],
    ["En mantenimiento", ind.mantenimiento],
    ["Disponibilidad (% operativos)", ind.disponibilidad === null ? "—" : `${ind.disponibilidad} %`],
    ["Fallas pendientes", ind.fallasPendientes],
    ["Fallas resueltas", ind.fallasResueltas],
    ["Tiempo medio de reparación (MTTR)", ind.mttr === null ? "Sin datos" : duracion(ind.mttr)],
  ];

  // Hoja 2: inventario.
  const inventario: Row[] = [
    encabezado([
      "Código",
      "Nombre",
      "Marca",
      "Modelo",
      "Ubicación",
      "Estado",
      "Fallas pendientes",
      "Fecha de alta",
    ]),
    ...equipos.map((e): Row => [
      texto(e.codigo, { format: "@" }),
      texto(e.nombre),
      texto(e.marca),
      texto(e.modelo),
      texto(e.ubicacion),
      texto(e.estado, {
        fontWeight: "bold",
        textColor:
          e.estado === "Operativo" ? "#047857" : e.estado === "Con falla" ? "#B91C1C" : "#B45309",
      }),
      pendientes.get(e.id) ?? 0,
      fechaCelda(e.creado_en),
    ]),
  ];

  // Hoja 3: historial de reportes.
  const historial: Row[] = [
    encabezado([
      "Código equipo",
      "Equipo",
      "Tipo",
      "Descripción",
      "Estado",
      "Reportado",
      "Resuelto",
      "Tiempo de resolución",
      "Nota de cierre",
    ]),
    ...[...reportes]
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
      .map((r): Row => {
        const equipo = porId.get(r.equipo_id);
        const tiempo = r.resuelto_en
          ? duracion(new Date(r.resuelto_en).getTime() - new Date(r.creado_en).getTime())
          : null;
        return [
          texto(equipo?.codigo, { format: "@" }),
          texto(equipo?.nombre),
          texto(r.tipo),
          texto(r.descripcion, { wrap: true }),
          texto(r.estado_atencion),
          fechaCelda(r.creado_en),
          fechaCelda(r.resuelto_en),
          texto(tiempo),
          texto(r.nota_cierre, { wrap: true }),
        ];
      }),
  ];

  // Hoja 4: trazabilidad de los cambios de estado.
  const trazabilidad: Row[] = [
    encabezado(["Fecha", "Código equipo", "Equipo", "Estado anterior", "Estado nuevo", "Origen"]),
    ...[...cambios]
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
      .map((c): Row => {
        const equipo = porId.get(c.equipo_id);
        return [
          fechaCelda(c.creado_en),
          texto(equipo?.codigo, { format: "@" }),
          texto(equipo?.nombre),
          texto(c.estado_anterior ?? "—"),
          texto(c.estado_nuevo),
          texto(c.origen),
        ];
      }),
  ];

  const hojas: Sheet<Blob>[] = [
    { sheet: "Resumen", data: resumen, columns: [{ width: 36 }, { width: 22 }] },
    {
      sheet: "Inventario",
      data: inventario,
      stickyRowsCount: 1,
      columns: [14, 28, 16, 16, 20, 15, 10, 18].map((width) => ({ width })),
    },
    {
      sheet: "Reportes",
      data: historial,
      stickyRowsCount: 1,
      columns: [14, 24, 12, 48, 12, 18, 18, 14, 40].map((width) => ({ width })),
    },
    {
      sheet: "Cambios de estado",
      data: trazabilidad,
      stickyRowsCount: 1,
      columns: [18, 14, 28, 16, 16, 24].map((width) => ({ width })),
    },
  ];

  const nombre = `BioMedManager_inventario_${ahora.toISOString().slice(0, 10)}.xlsx`;
  await writeXlsxFile(hojas).toFile(nombre);
}
