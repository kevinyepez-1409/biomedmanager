import { Icono, type NombreIcono } from "./Icono";

const TONOS = {
  neutro: "bg-slate-100 text-slate-600",
  marca: "bg-marca-50 text-marca-700",
  verde: "bg-emerald-50 text-emerald-700",
  rojo: "bg-red-50 text-red-700",
  ambar: "bg-amber-50 text-amber-700",
} as const;

export function Indicador({
  titulo,
  valor,
  detalle,
  icono,
  tono = "neutro",
}: {
  titulo: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  icono: NombreIcono;
  tono?: keyof typeof TONOS;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TONOS[tono]}`}>
          <Icono nombre={icono} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}
