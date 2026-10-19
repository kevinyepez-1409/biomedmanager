
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Equipo = {
  id: string;
  codigo: string;
  nombre: string;
  marca: string;
  modelo: string;
  ubicacion: string;
  estado: string;
};

type Reporte = {
  id: string;
  tipo: string;
  descripcion: string;
  estado_atencion: string;
  creado_en: string;
};

export default function DetalleEquipo() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipo, setTipo] = useState("Falla");
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Load equipment and reports from Supabase.
  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        const supabase = createClient();

        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (!activo) return;

        if (authError || !auth.user) {
          router.replace("/login");
          return;
        }

        const { data: equipoData, error: equipoError } =
          await supabase
            .from("equipos")
            .select("*")
            .eq("id", id)
            .single();

        if (equipoError) throw equipoError;

        const { data: reportesData, error: reportesError } =
          await supabase
            .from("reportes")
            .select("*")
            .eq("equipo_id", id)
            .order("creado_en", { ascending: false });

        if (reportesError) throw reportesError;

        if (activo) {
          setEquipo(equipoData as Equipo);
          setReportes((reportesData ?? []) as Reporte[]);
        }
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la información."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [id, router]);

  // Save a new incident or observation.
  async function guardarReporte(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    setError("");
    setMensaje("");

    const texto = descripcion.trim();

    if (texto.length < 5 || texto.length > 2000) {
      setError("La descripción debe tener entre 5 y 2000 caracteres.");
      return;
    }

    setGuardando(true);

    try {
      const supabase = createClient();

      const { data, error: dbError } = await supabase
        .from("reportes")
        .insert({
          equipo_id: id,
          tipo,
          descripcion: texto,
          estado_atencion: "Pendiente",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setReportes((anteriores) => [
        data as Reporte,
        ...anteriores,
      ]);

      setDescripcion("");
      setTipo("Falla");
      setMensaje("Reporte guardado correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el reporte."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <main className="p-8">Cargando equipo...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-blue-700 hover:underline"
        >
          ← Volver al inventario
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-800">
          BioMedManager
        </h1>

        {error && (
          <p role="alert" className="my-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {equipo && (
          <>
            <section className="mt-6 rounded-xl border bg-white p-6">
              <h2 className="text-2xl font-semibold">
                {equipo.nombre}
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p><strong>Código:</strong> {equipo.codigo}</p>
                <p><strong>Marca:</strong> {equipo.marca}</p>
                <p><strong>Modelo:</strong> {equipo.modelo}</p>
                <p><strong>Ubicación:</strong> {equipo.ubicacion}</p>
                <p><strong>Estado:</strong> {equipo.estado}</p>
              </div>
            </section>

            <section className="mt-6 rounded-xl border bg-white p-6">
              <h2 className="text-xl font-semibold">
                Registrar falla u observación
              </h2>

              <form onSubmit={guardarReporte} className="mt-5">
                <label className="block">
                  Tipo de reporte
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="mt-2 w-full rounded-lg border bg-white p-3"
                  >
                    <option value="Falla">Falla</option>
                    <option value="Observación">Observación</option>
                  </select>
                </label>

                <label className="mt-5 block">
                  Descripción detallada
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    minLength={5}
                    maxLength={2000}
                    rows={5}
                    required
                    placeholder="Describe qué ocurrió con el equipo..."
                    className="mt-2 w-full rounded-lg border bg-white p-3"
                  />
                </label>

                {mensaje && (
                  <p className="mt-4 text-green-700">{mensaje}</p>
                )}

                <button
                  type="submit"
                  disabled={guardando}
                  className="mt-5 rounded-lg bg-blue-700 px-6 py-3 text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar reporte"}
                </button>
              </form>
            </section>

            <section className="mt-6 rounded-xl border bg-white p-6">
              <h2 className="mb-5 text-xl font-semibold">
                Historial de reportes
              </h2>

              {reportes.length === 0 ? (
                <p className="text-slate-500">
                  No hay reportes para este equipo.
                </p>
              ) : (
                <div className="space-y-4">
                  {reportes.map((reporte) => (
                    <article
                      key={reporte.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <strong>{reporte.tipo}</strong>
                        <span className="text-sm text-slate-500">
                          {new Date(
                            reporte.creado_en
                          ).toLocaleString("es-EC")}
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap">
                        {reporte.descripcion}
                      </p>

                      <p className="mt-3 text-sm text-amber-700">
                        Estado: {reporte.estado_atencion}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
