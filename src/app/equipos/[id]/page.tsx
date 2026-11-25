"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EncabezadoApp } from "@/components/EncabezadoApp";
import { AtencionBadge, EstadoBadge } from "@/components/EstadoBadge";
import { Aviso } from "@/components/Aviso";
import { Icono } from "@/components/Icono";
import { botonPrimario, botonSecundario, campo, etiqueta, tarjeta } from "@/components/estilos";
import { mensajeDeError } from "@/lib/errores";
import { duracion, fecha, fechaHora } from "@/lib/formato";
import {
  COLUMNAS_EQUIPO,
  COLUMNAS_REPORTE,
  LONGITUD_TEXTO,
  esFallaPendiente,
  type Equipo,
  type EstadoEquipo,
  type Reporte,
  type TipoReporte,
} from "@/lib/tipos";

type Avisos = { error?: string; exito?: string };

export default function FichaEquipo() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [correo, setCorreo] = useState<string>();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [avisos, setAvisos] = useState<Avisos>({});
  const [editando, setEditando] = useState(false);

  const recargarEquipo = useCallback(async () => {
    const { data } = await createClient().from("equipos").select(COLUMNAS_EQUIPO).eq("id", id).single();
    if (data) setEquipo(data as Equipo);
  }, [id]);

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
          supabase.from("equipos").select(COLUMNAS_EQUIPO).eq("id", id).single(),
          supabase
            .from("reportes")
            .select(COLUMNAS_REPORTE)
            .eq("equipo_id", id)
            .order("creado_en", { ascending: false }),
        ]);
        if (!activo) return;

        if (eq.error) {
          setAvisos({ error: mensajeDeError(eq.error, "la carga del equipo") });
          return;
        }
        setEquipo(eq.data as Equipo);
        setReportes((rep.data ?? []) as Reporte[]);
      } catch {
        if (activo) setAvisos({ error: "No se pudo conectar con el servidor. Revisa tu internet." });
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [id, router]);

  const fallasPendientes = useMemo(() => reportes.filter(esFallaPendiente).length, [reportes]);

  const resumen = useMemo(() => {
    const fallas = reportes.filter((r) => r.tipo === "Falla");
    const resueltas = fallas.filter((r) => r.resuelto_en);
    const mttr =
      resueltas.length === 0
        ? null
        : resueltas.reduce(
            (s, r) => s + new Date(r.resuelto_en!).getTime() - new Date(r.creado_en).getTime(),
            0
          ) / resueltas.length;
    return { fallas: fallas.length, observaciones: reportes.length - fallas.length, mttr };
  }, [reportes]);

  return (
    <div className="min-h-screen">
      <EncabezadoApp correo={correo} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-marca-700"
        >
          <Icono nombre="atras" className="h-4 w-4" />
          Volver al panel
        </Link>

        <div className="mt-4 space-y-3">
          {avisos.error && (
            <Aviso tipo="error" onCerrar={() => setAvisos({})}>
              {avisos.error}
            </Aviso>
          )}
          {avisos.exito && (
            <Aviso tipo="exito" onCerrar={() => setAvisos({})}>
              {avisos.exito}
            </Aviso>
          )}
        </div>

        {cargando ? (
          <div className="mt-4 animate-pulse space-y-4">
            <div className="h-40 rounded-2xl bg-slate-200/70" />
            <div className="h-64 rounded-2xl bg-slate-200/70" />
          </div>
        ) : !equipo ? (
          <div className={`${tarjeta} mt-4 px-6 py-14 text-center`}>
            <p className="font-semibold text-slate-900">Equipo no encontrado</p>
            <p className="mt-1 text-sm text-slate-500">
              El enlace no es válido o el equipo no pertenece a tu inventario.
            </p>
            <Link href="/" className={`${botonPrimario} mt-5`}>
              Ir al panel
            </Link>
          </div>
        ) : (
          <>
            {/* Cabecera del equipo */}
            <section className={`${tarjeta} mt-4 p-5 sm:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-slate-500">{equipo.codigo}</p>
                  <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">
                    {equipo.nombre}
                  </h1>
                  <div className="mt-2">
                    <EstadoBadge estado={equipo.estado} grande />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/equipos/${equipo.id}/etiqueta`} className={botonSecundario}>
                    <Icono nombre="qr" className="h-4 w-4" />
                    Etiqueta QR
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditando((v) => !v)}
                    className={botonSecundario}
                    aria-expanded={editando}
                  >
                    <Icono nombre="editar" className="h-4 w-4" />
                    {editando ? "Cancelar edición" : "Editar datos"}
                  </button>
                </div>
              </div>

              {editando ? (
                <FormularioEdicion
                  equipo={equipo}
                  onGuardado={(e) => {
                    setEquipo(e);
                    setEditando(false);
                    setAvisos({ exito: "Datos del equipo actualizados." });
                  }}
                />
              ) : (
                <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Dato titulo="Marca" valor={equipo.marca} />
                  <Dato titulo="Modelo" valor={equipo.modelo} />
                  <Dato titulo="Ubicación" valor={equipo.ubicacion} />
                  <Dato titulo="Fecha de alta" valor={fecha(equipo.creado_en)} />
                </dl>
              )}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <div className="space-y-6">
                <CambioEstado
                  equipo={equipo}
                  fallasPendientes={fallasPendientes}
                  onCambio={(e) => {
                    setEquipo(e);
                    setAvisos({ exito: `Estado actualizado a «${e.estado}».` });
                  }}
                  onError={(error) => setAvisos({ error })}
                />

                <NuevoReporte
                  equipoId={equipo.id}
                  onCreado={async (r) => {
                    setReportes((anteriores) => [r, ...anteriores]);
                    await recargarEquipo();
                    setAvisos({
                      exito:
                        r.tipo === "Falla"
                          ? "Falla registrada. El equipo quedó «Con falla» hasta que se resuelva."
                          : "Observación registrada.",
                    });
                  }}
                />
              </div>

              <section className={tarjeta}>
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">Historial de reportes</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {resumen.fallas} {resumen.fallas === 1 ? "falla" : "fallas"} · {resumen.observaciones}{" "}
                    {resumen.observaciones === 1 ? "observación" : "observaciones"}
                    {resumen.mttr !== null && ` · tiempo medio de reparación ${duracion(resumen.mttr)}`}
                  </p>
                </div>

                {reportes.length === 0 ? (
                  <p className="px-5 py-12 text-center text-sm text-slate-500">
                    Este equipo todavía no tiene reportes.
                  </p>
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {reportes.map((r) => (
                      <ItemHistorial
                        key={r.id}
                        reporte={r}
                        onResuelto={(actualizado) => {
                          setReportes((lista) => lista.map((x) => (x.id === actualizado.id ? actualizado : x)));
                          setAvisos({
                            exito:
                              actualizado.tipo === "Falla"
                                ? "Falla resuelta. Verifica el equipo antes de marcarlo como Operativo."
                                : "Observación cerrada.",
                          });
                        }}
                      />
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</dt>
      <dd className="mt-1 text-slate-800">{valor}</dd>
    </div>
  );
}

function FormularioEdicion({ equipo, onGuardado }: { equipo: Equipo; onGuardado: (e: Equipo) => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const cambios = {
      nombre: String(datos.get("nombre") ?? "").trim(),
      marca: String(datos.get("marca") ?? "").trim(),
      modelo: String(datos.get("modelo") ?? "").trim(),
      ubicacion: String(datos.get("ubicacion") ?? "").trim(),
    };
    if (Object.values(cambios).some((v) => !v)) {
      setError("Ningún campo puede quedar vacío.");
      return;
    }

    setGuardando(true);
    setError("");
    const { data, error: dbError } = await createClient()
      .from("equipos")
      .update(cambios)
      .eq("id", equipo.id)
      .select(COLUMNAS_EQUIPO)
      .single();
    setGuardando(false);

    if (dbError) setError(mensajeDeError(dbError, "la actualización"));
    else onGuardado(data as Equipo);
  }

  const campos = [
    ["nombre", "Nombre"],
    ["marca", "Marca"],
    ["modelo", "Modelo"],
    ["ubicacion", "Ubicación"],
  ] as const;

  return (
    <form onSubmit={guardar} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map(([nombre, texto]) => (
          <label key={nombre} className={etiqueta}>
            {texto}
            <input name={nombre} defaultValue={equipo[nombre]} required maxLength={120} className={campo} />
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-500">El código de inventario no se puede modificar.</p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <button type="submit" disabled={guardando} className={botonPrimario}>
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function CambioEstado({
  equipo,
  fallasPendientes,
  onCambio,
  onError,
}: {
  equipo: Equipo;
  fallasPendientes: number;
  onCambio: (e: Equipo) => void;
  onError: (mensaje: string) => void;
}) {
  const [guardando, setGuardando] = useState<EstadoEquipo | null>(null);

  async function cambiar(estado: EstadoEquipo) {
    setGuardando(estado);
    // La base de datos tambien lo impide; aqui solo se explica antes.
    if (estado === "Operativo" && fallasPendientes > 0) {
      onError(
        `No se puede marcar como Operativo: el equipo tiene ${fallasPendientes} ${
          fallasPendientes === 1 ? "falla pendiente" : "fallas pendientes"
        }. Resuélvelas primero.`
      );
      setGuardando(null);
      return;
    }

    const { data, error } = await createClient()
      .from("equipos")
      .update({ estado })
      .eq("id", equipo.id)
      .select(COLUMNAS_EQUIPO)
      .single();
    setGuardando(null);

    if (error) onError(mensajeDeError(error, "el cambio de estado"));
    else onCambio(data as Equipo);
  }

  const opciones: { estado: EstadoEquipo; texto: string; icono: "check" | "llave" }[] = [
    { estado: "Operativo", texto: "Marcar operativo", icono: "check" },
    { estado: "Mantenimiento", texto: "Enviar a mantenimiento", icono: "llave" },
  ];

  return (
    <section className={`${tarjeta} p-5`}>
      <h2 className="font-semibold text-slate-900">Estado del equipo</h2>
      {fallasPendientes > 0 ? (
        <p className="mt-2 flex gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {fallasPendientes} {fallasPendientes === 1 ? "falla pendiente" : "fallas pendientes"}: no puede
            volver a «Operativo» hasta resolverlas.
          </span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-500">Sin fallas pendientes.</p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {opciones.map((o) => {
          const actual = equipo.estado === o.estado;
          const bloqueado = o.estado === "Operativo" && fallasPendientes > 0;
          return (
            <button
              key={o.estado}
              type="button"
              onClick={() => cambiar(o.estado)}
              disabled={actual || guardando !== null}
              title={bloqueado ? "Resuelve las fallas pendientes primero" : undefined}
              className={`${actual ? botonPrimario : botonSecundario} ${bloqueado && !actual ? "opacity-70" : ""}`}
            >
              <Icono nombre={o.icono} className="h-4 w-4" />
              {actual ? o.estado : guardando === o.estado ? "Guardando…" : o.texto}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function NuevoReporte({
  equipoId,
  onCreado,
}: {
  equipoId: string;
  onCreado: (r: Reporte) => void | Promise<void>;
}) {
  const [tipo, setTipo] = useState<TipoReporte>("Falla");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const texto = descripcion.trim();
    if (texto.length < LONGITUD_TEXTO.min || texto.length > LONGITUD_TEXTO.max) {
      setError(`La descripción debe tener entre ${LONGITUD_TEXTO.min} y ${LONGITUD_TEXTO.max} caracteres.`);
      return;
    }

    setGuardando(true);
    setError("");
    const { data, error: dbError } = await createClient()
      .from("reportes")
      .insert({ equipo_id: equipoId, tipo, descripcion: texto })
      .select(COLUMNAS_REPORTE)
      .single();
    setGuardando(false);

    if (dbError) {
      setError(mensajeDeError(dbError, "el registro del reporte"));
      return;
    }
    setDescripcion("");
    setTipo("Falla");
    await onCreado(data as Reporte);
  }

  return (
    <section className={`${tarjeta} p-5`}>
      <h2 className="font-semibold text-slate-900">Nuevo reporte</h2>
      <form onSubmit={guardar} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Tipo de reporte">
          {(["Falla", "Observación"] as TipoReporte[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => setTipo(t)}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                tipo === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className={etiqueta}>
          Descripción
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            maxLength={LONGITUD_TEXTO.max}
            required
            placeholder={
              tipo === "Falla"
                ? "Ej. La pantalla no enciende al conectar la alimentación."
                : "Ej. El cable del sensor de SpO2 muestra desgaste."
            }
            className={campo}
          />
          <span className="mt-1 block text-right text-xs text-slate-400">
            {descripcion.trim().length}/{LONGITUD_TEXTO.max}
          </span>
        </label>

        {tipo === "Falla" && (
          <p className="text-xs text-slate-500">
            Al registrar una falla, el equipo pasa automáticamente a «Con falla».
          </p>
        )}
        {error && <Aviso tipo="error">{error}</Aviso>}

        <button type="submit" disabled={guardando} className={`${botonPrimario} w-full`}>
          {guardando ? "Guardando…" : `Registrar ${tipo.toLowerCase()}`}
        </button>
      </form>
    </section>
  );
}

function ItemHistorial({ reporte, onResuelto }: { reporte: Reporte; onResuelto: (r: Reporte) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const esFalla = reporte.tipo === "Falla";

  async function resolver(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const texto = nota.trim();
    if (texto.length < LONGITUD_TEXTO.min) {
      setError(`Describe lo que se hizo (mínimo ${LONGITUD_TEXTO.min} caracteres).`);
      return;
    }
    setGuardando(true);
    setError("");
    const { data, error: dbError } = await createClient()
      .from("reportes")
      .update({ estado_atencion: "Resuelto", nota_cierre: texto })
      .eq("id", reporte.id)
      .select(COLUMNAS_REPORTE)
      .single();
    setGuardando(false);

    if (dbError) setError(mensajeDeError(dbError, "el cierre del reporte"));
    else {
      setAbierto(false);
      onResuelto(data as Reporte);
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex gap-3">
        <span
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
            reporte.estado_atencion === "Resuelto"
              ? "bg-slate-100 text-slate-500"
              : esFalla
                ? "bg-red-50 text-red-600"
                : "bg-marca-50 text-marca-700"
          }`}
        >
          <Icono
            nombre={reporte.estado_atencion === "Resuelto" ? "check" : esFalla ? "alerta" : "nota"}
            className="h-4 w-4"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{reporte.tipo}</span>
            <AtencionBadge estado={reporte.estado_atencion} />
            <span className="text-xs text-slate-400">{fechaHora(reporte.creado_en)}</span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-700">{reporte.descripcion}</p>

          {reporte.estado_atencion === "Resuelto" && reporte.resuelto_en && (
            <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
              <p className="text-xs font-medium text-slate-500">
                Resuelto el {fechaHora(reporte.resuelto_en)} · en{" "}
                {duracion(new Date(reporte.resuelto_en).getTime() - new Date(reporte.creado_en).getTime())}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">{reporte.nota_cierre}</p>
            </div>
          )}

          {reporte.estado_atencion === "Pendiente" &&
            (abierto ? (
              <form onSubmit={resolver} className="mt-3 space-y-3">
                <label className={etiqueta}>
                  Nota de cierre
                  <textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    rows={3}
                    maxLength={LONGITUD_TEXTO.max}
                    autoFocus
                    placeholder="¿Qué se hizo? Ej. Se reemplazó el fusible y se verificó el encendido."
                    className={campo}
                  />
                </label>
                {error && <Aviso tipo="error">{error}</Aviso>}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={guardando} className={botonPrimario}>
                    {guardando ? "Guardando…" : "Confirmar resolución"}
                  </button>
                  <button type="button" onClick={() => setAbierto(false)} className={botonSecundario}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAbierto(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-marca-700 hover:text-marca-900"
              >
                <Icono nombre="check" className="h-4 w-4" />
                Resolver
              </button>
            ))}
        </div>
      </div>
    </li>
  );
}
