import { Icono } from "./Icono";

export function Logo({ claro = false, compacto = false }: { claro?: boolean; compacto?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl ${
          claro ? "bg-white/15 text-white" : "bg-marca-600 text-white"
        }`}
      >
        <Icono nombre="pulso" className="h-5 w-5" grosor={2.2} />
      </span>
      {!compacto && (
        <span
          className={`text-lg font-semibold tracking-tight ${claro ? "text-white" : "text-slate-900"}`}
        >
          BioMed<span className={claro ? "text-marca-200" : "text-marca-600"}>Manager</span>
        </span>
      )}
    </span>
  );
}
