"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EncabezadoApp } from "@/components/EncabezadoApp";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Indicador } from "@/components/Indicador";
import { Aviso } from "@/components/Aviso";
import { Icono } from "@/components/Icono";
import { botonPrimario, botonSecundario, campo, etiqueta, tarjeta } from "@/components/estilos";
import { calcularIndicadores, pendientesPorEquipo } from "@/lib/indicadores";
import { mensajeDeError } from "@/lib/errores";
import { desde, duracion } from "@/lib/formato";
import {
  COLUMNAS_EQUIPO,
  COLUMNAS_REPORTE,
  ESTADOS_ELEGIBLES,
  ESTADOS_EQUIPO,
  esFallaPendiente,
  type Equipo,
  type EstadoEquipo,
  type Reporte,
} from "@/lib/tipos";

type Filtro = "Todos" | EstadoEquipo;

export default function Panel() {
  const router = useRouter();

  const [correo, setCorreo] = useState<string>();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const supabase = createClient();
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (!activo) return;

        if (authError || !auth.user) {
          router.replace("/login");
          return;
        }
        setCorreo(auth.user.email ?? undefined);

        const [eq, rep] = await Promise.all([
          supabase.from("equipos").select(COLUMNAS_EQUIPO).order("creado_en", { ascending: false }),
          supabase.from("reportes").select(COLUMNAS_REPORTE).order("creado_en", { ascending: false }),
        ]);
        if (!activo) return;

        if (eq.error || rep.error) {
          setError(mensajeDeError(eq.error ?? rep.error, "la carga del inventario"));
          return;
        }

        setEquipos((eq.data ?? []) as Equipo[]);
        setReportes((rep.data ?? []) as Reporte[]);
      } catch {
        if (activo) setError("No se pudo conectar con el servidor. Revisa tu internet.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [router]);

  const indicadores = useMemo(() => calcularIndicadores(equipos, reportes), [equipos, reportes]);
  const pendientes = useMemo(() => pendientesPorEquipo(reportes), [reportes]);

  const conteo = useMemo(() => {
    const c: Record<Filtro, number> = { Todos: equipos.length, Operativo: 0, "Con falla": 0, Mantenimiento: 0 };
    for (const e of equipos) c[e.estado]++;
    return c;
  }, [equipos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return equipos.filter(
      (e) =>
        (filtro === "Todos" || e.estado === filtro) &&
        (!q ||
          [e.codigo, e.nombre, e.marca, e.modelo, e.ubicacion].some((v) => v.toLowerCase().includes(q)))
    );
  }, [equipos, busqueda, filtro]);

  // Equipos con fallas pendientes, primero los que llevan mas tiempo.
  const atencion = useMemo(() => {
    const masAntigua = new Map<string, string>();
    for (const r of reportes) {
      if (!esFallaPendiente(r)) continue;
      const actual = masAntigua.get(r.equipo_id);
      if (!actual || r.creado_en < actual) masAntigua.set(r.equipo_id, r.creado_en);
    }
    return equipos
      .filter((e) => masAntigua.has(e.id))
      .map((e) => ({ equipo: e, desde: masAntigua.get(e.id)! }))
      .sort((a, b) => a.desde.localeCompare(b.desde));
  }, [equipos, reportes]);

  async function exportar() {
    setExportando(true);
    setError("");
    try {
      const { exportarInventarioExcel } = await import("@/lib/exportar");
      await exportarInventarioExcel(equipos, reportes);
    } catch {
      setError("No se pudo generar el archivo Excel. Inténtalo de nuevo.");
    } finally {
      setExportando(false);
    }
  }

  function equipoCreado(equipo: Equipo) {
    setEquipos((actuales) => [equipo, ...actuales]);
    setFormularioAbierto(false);
    setMensaje(`Equipo ${equipo.codigo} registrado correctamente.`);
  }

  return (
    <div className="min-h-screen">
      <EncabezadoApp correo={correo} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Panel de equipos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Estado del inventario biomédico y fallas por atender.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportar}
              disabled={cargando || exportando || equipos.length === 0}
              className={botonSecundario}
            >
              <Icono nombre="descargar" className="h-4 w-4" />
              {exportando ? "Generando…" : "Exportar a Excel"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormularioAbierto(true);
                setMensaje("");
              }}
              disabled={cargando}
              className={botonPrimario}
            >
              <Icono nombre="mas" className="h-4 w-4" />
              Agregar equipo
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {error && (
            <Aviso tipo="error" onCerrar={() => setError("")}>
              {error}
            </Aviso>
          )}
          {mensaje && (
            <Aviso tipo="exito" onCerrar={() => setMensaje("")}>
              {mensaje}
            </Aviso>
          )}
        </div>

        {cargando ? (
          <Esqueleto />
        ) : (
          <>
            <section aria-label="Indicadores" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Indicador
                titulo="Disponibilidad"
                icono="escudo"
                tono="verde"
                valor={indicadores.disponibilidad === null ? "—" : `${indicadores.disponibilidad} %`}
                detalle={`${indicadores.operativos} de ${indicadores.total} equipos operativos`}
              />
              <Indicador
                titulo="Fallas pendientes"
                icono="alerta"
                tono={indicadores.fallasPendientes > 0 ? "rojo" : "neutro"}
                valor={indicadores.fallasPendientes}
                detalle={
                  indicadores.fallaMasAntigua
                    ? `La más antigua, hace ${desde(indicadores.fallaMasAntigua.reporte.creado_en)}`
                    : "Ninguna falla abierta"
                }
              />
              <Indicador
                titulo="Fuera de servicio"
                icono="llave"
                tono="ambar"
                valor={indicadores.conFalla + indicadores.mantenimiento}
                detalle={`${indicadores.conFalla} con falla · ${indicadores.mantenimiento} en mantenimiento`}
              />
              <Indicador
                titulo="Tiempo medio de reparación"
                icono="reloj"
                tono="marca"
                valor={indicadores.mttr === null ? "—" : duracion(indicadores.mttr)}
                detalle={
                  indicadores.fallasResueltas === 0
                    ? "Aún no hay fallas resueltas (MTTR)"
                    : `MTTR de ${indicadores.fallasResueltas} ${
                        indicadores.fallasResueltas === 1 ? "falla resuelta" : "fallas resueltas"
                      }`
                }
              />
            </section>

            {atencion.length > 0 && (
              <section className={`${tarjeta} mt-6 border-red-200`}>
                <div className="flex items-center gap-2 border-b border-red-100 px-5 py-4">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600">
                    <Icono nombre="alerta" className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-900">Requiere atención</h2>
                    <p className="text-xs text-slate-500">
                      Equipos con fallas sin resolver: no deben usarse con pacientes.
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {atencion.map(({ equipo, desde: inicio }) => (
                    <li key={equipo.id}>
                      <Link
                        href={`/equipos/${equipo.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            <span className="font-mono text-slate-500">{equipo.codigo}</span> · {equipo.nombre}
                          </p>
                          <p className="text-xs text-slate-500">{equipo.ubicacion}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span>
                            {pendientes.get(equipo.id)}{" "}
                            {pendientes.get(equipo.id) === 1 ? "falla" : "fallas"} · hace {desde(inicio)}
                          </span>
                          <EstadoBadge estado={equipo.estado} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={`${tarjeta} mt-6`}>
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Inventario</h2>
                  <p className="text-xs text-slate-500">
                    {visibles.length} de {equipos.length} equipos
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="relative block">
                    <span className="sr-only">Buscar equipos</span>
                    <Icono
                      nombre="buscar"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por código, nombre, marca…"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-500/20 sm:w-72"
                    />
                  </label>

                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
                    {(["Todos", ...ESTADOS_EQUIPO] as Filtro[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFiltro(f)}
                        aria-pressed={filtro === f}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          filtro === f
                            ? "bg-marca-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {f} <span className="opacity-70">{conteo[f]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {equipos.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-marca-50 text-marca-600">
                    <Icono nombre="equipo" className="h-7 w-7" />
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">Tu inventario está vacío</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Registra tu primer equipo biomédico para empezar a seguir su estado y sus fallas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormularioAbierto(true)}
                    className={`${botonPrimario} mt-5`}
                  >
                    <Icono nombre="mas" className="h-4 w-4" />
                    Agregar equipo
                  </button>
                </div>
              ) : visibles.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-slate-500">
                  Ningún equipo coincide con la búsqueda o el filtro.
                </p>
              ) : (
                <>
                  {/* Tabla en pantallas medianas y grandes */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-medium">Código</th>
                          <th scope="col" className="px-5 py-3 font-medium">Equipo</th>
                          <th scope="col" className="px-5 py-3 font-medium">Ubicación</th>
                          <th scope="col" className="px-5 py-3 font-medium">Estado</th>
                          <th scope="col" className="px-5 py-3 text-center font-medium">Fallas pend.</th>
                          <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibles.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-600">{e.codigo}</td>
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-slate-900">{e.nombre}</p>
                              <p className="text-xs text-slate-500">
                                {e.marca} · {e.modelo}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">{e.ubicacion}</td>
                            <td className="px-5 py-3.5">
                              <EstadoBadge estado={e.estado} />
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {pendientes.get(e.id) ? (
                                <span className="inline-grid h-6 min-w-6 place-items-center rounded-full bg-red-100 px-2 text-xs font-semibold text-red-700">
                                  {pendientes.get(e.id)}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Link
                                href={`/equipos/${e.id}`}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium text-marca-700 hover:bg-marca-50"
                              >
                                Ver ficha
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tarjetas en celulares */}
                  <ul className="divide-y divide-slate-100 md:hidden">
                    {visibles.map((e) => (
                      <li key={e.id}>
                        <Link href={`/equipos/${e.id}`} className="block px-5 py-4 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-slate-500">{e.codigo}</p>
                              <p className="truncate font-medium text-slate-900">{e.nombre}</p>
                              <p className="text-xs text-slate-500">
                                {e.ubicacion} · {e.marca}
                              </p>
                            </div>
                            <EstadoBadge estado={e.estado} />
                          </div>
                          {pendientes.get(e.id) ? (
                            <p className="mt-2 text-xs font-medium text-red-700">
                              {pendientes.get(e.id)} {pendientes.get(e.id) === 1 ? "falla pendiente" : "fallas pendientes"}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          BioMedManager · Prototipo académico · No apto para uso clínico real
        </p>
      </main>

      {formularioAbierto && (
        <FormularioEquipo onCerrar={() => setFormularioAbierto(false)} onCreado={equipoCreado} />
      )}
    </div>
  );
}

function FormularioEquipo({
  onCerrar,
  onCreado,
}: {
  onCerrar: () => void;
  onCreado: (equipo: Equipo) => void;
}) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const valor = (k: string) => String(datos.get(k) ?? "").trim();

    const nuevo = {
      codigo: valor("codigo").toUpperCase(),
      nombre: valor("nombre"),
      marca: valor("marca"),
      modelo: valor("modelo"),
      ubicacion: valor("ubicacion"),
      estado: valor("estado") as EstadoEquipo,
    };

    if (Object.values(nuevo).some((v) => !v)) {
      setError("Completa todos los campos.");
      return;
    }
    if (!ESTADOS_ELEGIBLES.includes(nuevo.estado)) {
      setError("Selecciona un estado válido.");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      const { data, error: dbError } = await createClient()
        .from("equipos")
        .insert(nuevo)
        .select(COLUMNAS_EQUIPO)
        .single();

      if (dbError) {
        setError(mensajeDeError(dbError, "el registro del equipo"));
        return;
      }
      onCreado(data as Equipo);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const campos: { nombre: string; etiqueta: string; ejemplo: string }[] = [
    { nombre: "codigo", etiqueta: "Código de inventario", ejemplo: "Ej. BM-004" },
    { nombre: "nombre", etiqueta: "Nombre del equipo", ejemplo: "Ej. Monitor multiparámetro" },
    { nombre: "marca", etiqueta: "Marca", ejemplo: "Ej. Philips" },
    { nombre: "modelo", etiqueta: "Modelo", ejemplo: "Ej. IntelliVue MX450" },
    { nombre: "ubicacion", etiqueta: "Ubicación / servicio", ejemplo: "Ej. UCI, cama 3" },
  ];

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-alta"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="titulo-alta" className="text-lg font-semibold text-slate-900">
            Registrar equipo
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <Icono nombre="cerrar" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {campos.map((c, i) => (
              <label key={c.nombre} className={`${etiqueta} ${i === 1 ? "sm:col-span-2" : ""}`}>
                {c.etiqueta}
                <input
                  name={c.nombre}
                  required
                  maxLength={120}
                  autoFocus={i === 0}
                  placeholder={c.ejemplo}
                  className={campo}
                />
              </label>
            ))}
            <label className={etiqueta}>
              Estado inicial
              <select name="estado" defaultValue="Operativo" className={campo}>
                {ESTADOS_ELEGIBLES.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-500">
            El estado «Con falla» se asigna automáticamente al reportar una falla desde la ficha del equipo.
          </p>

          {error && <Aviso tipo="error">{error}</Aviso>}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onCerrar} className={botonSecundario}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className={botonPrimario}>
              {guardando ? "Guardando…" : "Guardar equipo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="mt-6 animate-pulse space-y-6" aria-label="Cargando">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-slate-200/70" />
    </div>
  );
}
