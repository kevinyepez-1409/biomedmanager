import { Icono, type NombreIcono } from "./Icono";
import { Logo } from "./Logo";

const PUNTOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: "escudo",
    titulo: "Ningún equipo con falla figura como disponible",
    texto: "La regla se aplica en la base de datos, no solo en la pantalla.",
  },
  {
    icono: "reloj",
    titulo: "Qué está fuera de servicio, por qué y desde cuándo",
    texto: "Historial de cada equipo con fallas, resoluciones y tiempos.",
  },
  {
    icono: "descargar",
    titulo: "Tu inventario en Excel cuando lo necesites",
    texto: "Exporta equipos, reportes e indicadores con un clic.",
  },
];

// Diseño compartido por las pantallas de acceso (login, registro, errores).
export function MarcoAcceso({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-marca-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-marca-600/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-marca-400/20 blur-3xl"
        />

        <div className="relative">
          <Logo claro />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Gestión de equipos biomédicos con el ciclo de cada falla bajo control.
          </h2>
          <ul className="mt-10 space-y-6">
            {PUNTOS.map((p) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-marca-100">
                  <Icono nombre={p.icono} className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{p.titulo}</p>
                  <p className="mt-0.5 text-sm text-marca-100/80">{p.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-marca-100/60">
          Prototipo académico · Ingeniería Biomédica · Yachay Tech
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
          {subtitulo && <p className="mt-1.5 text-sm text-slate-500">{subtitulo}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
