import type { Equipo, EstadoEquipo, Reporte } from "@/lib/tipos";
import { tarjeta } from "./estilos";

// Colores de estado (validados con la guia de dataviz: separacion CVD
// suficiente en este orden). Nunca van solos: siempre con nombre y valor.
const COLOR_ESTADO: Record<EstadoEquipo, string> = {
  Operativo: "#10b981",
  "Con falla": "#ef4444",
  Mantenimiento: "#f59e0b",
};
const ORDEN: EstadoEquipo[] = ["Operativo", "Con falla", "Mantenimiento"];

const MESES = 6;

function porcentaje(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

export function GraficosPanel({ equipos, reportes }: { equipos: Equipo[]; reportes: Reporte[] }) {
  const total = equipos.length;
  const conteo = ORDEN.map((estado) => ({
    estado,
    n: equipos.filter((e) => e.estado === estado).length,
  }));

  // Fallas reportadas por mes (ultimos 6 meses, incluido el actual).
  const hoy = new Date();
  const meses = Array.from({ length: MESES }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (MESES - 1 - i), 1);
    return {
      clave: `${fecha.getFullYear()}-${fecha.getMonth()}`,
      etiqueta: fecha.toLocaleDateString("es-EC", { month: "short" }).replace(".", ""),
      nombre: fecha.toLocaleDateString("es-EC", { month: "long", year: "numeric" }),
      n: 0,
    };
  });
  for (const r of reportes) {
    if (r.tipo !== "Falla") continue;
    const d = new Date(r.creado_en);
    const mes = meses.find((m) => m.clave === `${d.getFullYear()}-${d.getMonth()}`);
    if (mes) mes.n++;
  }
  const maximo = Math.max(1, ...meses.map((m) => m.n));
  const totalFallas = meses.reduce((s, m) => s + m.n, 0);

  return (
    <section aria-label="Gráficos" className="mt-6 grid gap-4 lg:grid-cols-2">
      {/* Distribucion por estado: barra 100 % apilada */}
      <div className={`${tarjeta} p-5`}>
        <h2 className="font-semibold text-slate-900">Estado del inventario</h2>
        <p className="mt-0.5 text-xs text-slate-500">Distribución de los {total} equipos por estado</p>

        {total === 0 ? (
          <p className="mt-6 text-sm text-slate-500">Sin equipos registrados.</p>
        ) : (
          <>
            <div className="mt-5 flex h-7 w-full gap-0.5" aria-hidden="true">
              {conteo
                .filter((c) => c.n > 0)
                .map((c) => (
                  <div
                    key={c.estado}
                    title={`${c.estado}: ${c.n} (${porcentaje(c.n, total)} %)`}
                    className="h-full rounded-[4px] transition-opacity hover:opacity-80"
                    style={{ flexGrow: c.n, backgroundColor: COLOR_ESTADO[c.estado] }}
                  />
                ))}
            </div>

            <ul className="mt-4 grid grid-cols-3 gap-2">
              {conteo.map((c) => (
                <li key={c.estado} className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500 sm:text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: COLOR_ESTADO[c.estado] }}
                      aria-hidden="true"
                    />
                    <span>{c.estado}</span>
                  </span>
                  <span className="mt-0.5 block text-lg font-semibold text-slate-900">
                    {c.n}{" "}
                    <span className="text-xs font-normal text-slate-500">{porcentaje(c.n, total)} %</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Fallas por mes: columnas de una sola serie */}
      <div className={`${tarjeta} p-5`}>
        <h2 className="font-semibold text-slate-900">Fallas reportadas por mes</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Últimos {MESES} meses · {totalFallas} {totalFallas === 1 ? "falla" : "fallas"}
        </p>

        <div className="mt-5 flex h-32 items-end gap-2 border-b border-slate-300" aria-hidden="true">
          {meses.map((m) => (
            <div key={m.clave} className="group relative flex h-full flex-1 flex-col justify-end">
              <span
                className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-slate-700 ${
                  m.n === maximo && m.n > 0 ? "" : "opacity-0 group-hover:opacity-100"
                }`}
                style={{ bottom: `calc(${(m.n / maximo) * 100}% + 4px)` }}
              >
                {m.n}
              </span>
              <div
                title={`${m.nombre}: ${m.n} ${m.n === 1 ? "falla" : "fallas"}`}
                className="mx-auto w-full max-w-10 rounded-t-[4px] bg-marca-500 transition-colors group-hover:bg-marca-700"
                style={{ height: m.n === 0 ? "2px" : `${(m.n / maximo) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2" aria-hidden="true">
          {meses.map((m) => (
            <span key={m.clave} className="flex-1 text-center text-xs capitalize text-slate-500">
              {m.etiqueta}
            </span>
          ))}
        </div>

        {/* Version accesible de ambos graficos para lectores de pantalla */}
        <table className="sr-only">
          <caption>Fallas reportadas por mes</caption>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Fallas</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.clave}>
                <td>{m.nombre}</td>
                <td>{m.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
