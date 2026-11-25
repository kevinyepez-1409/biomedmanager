import { Icono } from "./Icono";

export function Aviso({
  tipo,
  children,
  onCerrar,
}: {
  tipo: "error" | "exito" | "info";
  children: React.ReactNode;
  onCerrar?: () => void;
}) {
  const estilos = {
    error: "border-red-200 bg-red-50 text-red-800",
    exito: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-marca-200 bg-marca-50 text-marca-900",
  }[tipo];

  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${estilos}`}
    >
      <Icono
        nombre={tipo === "error" ? "alerta" : tipo === "exito" ? "check" : "escudo"}
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <div className="flex-1">{children}</div>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          className="-m-1 rounded p-1 opacity-60 hover:opacity-100"
          aria-label="Cerrar aviso"
        >
          <Icono nombre="cerrar" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
