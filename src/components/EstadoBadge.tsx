import type { EstadoAtencion, EstadoEquipo } from "@/lib/tipos";

const ESTILOS: Record<EstadoEquipo, { clase: string; punto: string }> = {
  Operativo: { clase: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", punto: "bg-emerald-500" },
  "Con falla": { clase: "bg-red-50 text-red-700 ring-red-600/20", punto: "bg-red-500" },
  Mantenimiento: { clase: "bg-amber-50 text-amber-800 ring-amber-600/25", punto: "bg-amber-500" },
};

export function EstadoBadge({ estado, grande = false }: { estado: EstadoEquipo; grande?: boolean }) {
  const { clase, punto } = ESTILOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset ${clase} ${
        grande ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${punto}`} aria-hidden="true" />
      {estado}
    </span>
  );
}

export function AtencionBadge({ estado }: { estado: EstadoAtencion }) {
  return estado === "Resuelto" ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/15">
      Resuelto
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
      Pendiente
    </span>
  );
}
