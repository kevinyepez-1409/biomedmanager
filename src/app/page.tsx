
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Estado = "Operativo" | "Con falla" | "Mantenimiento";

type Equipo = {
  id: string;
  codigo: string;
  nombre: string;
  marca: string;
  modelo: string;
  ubicacion: string;
  estado: Estado;
};

export default function Home() {
  const router = useRouter();

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Load equipment records from Supabase.
  useEffect(() => {
    let activo = true;

    async function cargarEquipos() {
      try {
        const supabase = createClient();

        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (!activo) return;

        if (authError || !auth.user) {
          router.replace("/login");
          return;
        }

        const { data, error: dbError } = await supabase
          .from("equipos")
          .select("id,codigo,nombre,marca,modelo,ubicacion,estado")
          .order("creado_en", { ascending: false });

        if (!activo) return;

        if (dbError) {
          setError(`Error al cargar equipos: ${dbError.message}`);
        } else {
          setEquipos((data ?? []) as Equipo[]);
        }
      } catch {
        if (activo) {
          setError("No se pudo conectar con Supabase.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarEquipos();

    return () => {
      activo = false;
    };
  }, [router]);

  const operativos = equipos.filter(
    (equipo) => equipo.estado === "Operativo"
  ).length;

  // Save equipment records in PostgreSQL.
  async function registrarEquipo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);

    const codigo = String(datos.get("codigo") ?? "")
      .trim()
      .toUpperCase();

    const nombre = String(datos.get("nombre") ?? "").trim();
    const marca = String(datos.get("marca") ?? "").trim();
    const modelo = String(datos.get("modelo") ?? "").trim();
    const ubicacion = String(datos.get("ubicacion") ?? "").trim();
    const estado = String(datos.get("estado") ?? "") as Estado;

    setError("");
    setMensaje("");

    if (!codigo || !nombre || !marca || !modelo || !ubicacion) {
      setError("Completa todos los campos.");
      return;
    }

    if (!["Operativo", "Con falla", "Mantenimiento"].includes(estado)) {
      setError("Selecciona un estado válido.");
      return;
    }

    setGuardando(true);

    try {
      const supabase = createClient();

      const { data, error: dbError } = await supabase
        .from("equipos")
        .insert({
          codigo,
          nombre,
          marca,
          modelo,
          ubicacion,
          estado,
        })
        .select("id,codigo,nombre,marca,modelo,ubicacion,estado")
        .single();

      if (dbError) {
        if (dbError.code === "23505") {
          setError("Ya existe un equipo con ese código.");
        } else {
          setError(`No se pudo guardar: ${dbError.message}`);
        }
        return;
      }

      setEquipos((actuales) => [data as Equipo, ...actuales]);

      formulario.reset();
      setMostrarFormulario(false);
      setMensaje(`Equipo ${codigo} guardado correctamente.`);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  // End the current user session.
  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Cargando BioMedManager...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">
            BioMedManager
          </h1>
          <p className="text-sm text-slate-500">
            Sistema de gestión de equipamiento biomédico
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="mx-auto max-w-6xl p-8">
        <h2 className="text-3xl font-semibold">Panel principal</h2>
        <p className="mt-2 mb-8 text-slate-500">
          Inventario y estado de equipos médicos
        </p>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-6">
            <p>Total de equipos</p>
            <p className="mt-2 text-4xl font-bold">
              {equipos.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p>Operativos</p>
            <p className="mt-2 text-4xl font-bold text-green-600">
              {operativos}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p>Con falla o mantenimiento</p>
            <p className="mt-2 text-4xl font-bold text-orange-600">
              {equipos.length - operativos}
            </p>
          </div>
        </div>

        <section className="rounded-xl border bg-white p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-semibold">
              Inventario de equipos
            </h3>

            <button
              onClick={() => {
                setMostrarFormulario(!mostrarFormulario);
                setError("");
                setMensaje("");
              }}
              className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
            >
              {mostrarFormulario ? "Cancelar" : "+ Agregar equipo"}
            </button>
          </div>

          {mensaje && (
            <p className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}

          {mostrarFormulario && (
            <form
              onSubmit={registrarEquipo}
              className="mb-8 rounded-lg bg-slate-100 p-5"
            >
              <h4 className="mb-4 font-semibold">
                Registrar nuevo equipo
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  Código
                  <input
                    name="codigo"
                    required
                    placeholder="Ej. BM-004"
                    className="mt-1 w-full rounded border bg-white p-3"
                  />
                </label>

                <label className="block">
                  Nombre del equipo
                  <input
                    name="nombre"
                    required
                    placeholder="Ej. Desfibrilador"
                    className="mt-1 w-full rounded border bg-white p-3"
                  />
                </label>

                <label className="block">
                  Marca
                  <input
                    name="marca"
                    required
                    placeholder="Ej. Philips"
                    className="mt-1 w-full rounded border bg-white p-3"
                  />
                </label>

                <label className="block">
                  Modelo
                  <input
                    name="modelo"
                    required
                    placeholder="Ej. Modelo A"
                    className="mt-1 w-full rounded border bg-white p-3"
                  />
                </label>

                <label className="block">
                  Ubicación
                  <input
                    name="ubicacion"
                    required
                    placeholder="Ej. UCI"
                    className="mt-1 w-full rounded border bg-white p-3"
                  />
                </label>

                <label className="block">
                  Estado
                  <select
                    name="estado"
                    className="mt-1 w-full rounded border bg-white p-3"
                  >
                    <option>Operativo</option>
                    <option>Con falla</option>
                    <option>Mantenimiento</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800 disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar equipo"}
              </button>
            </form>
          )}

          {equipos.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-6 text-center text-slate-500">
              No hay equipos registrados. Agrega el primero.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Equipo</th>
                    <th className="p-4">Ubicación</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {equipos.map((equipo) => (
                    <tr key={equipo.id} className="border-t">
                      <td className="p-4">{equipo.codigo}</td>
                      <td className="p-4">{equipo.nombre}</td>
                      <td className="p-4">{equipo.ubicacion}</td>
                      <td className="p-4">{equipo.estado}</td>
                      
<td className="p-4">
  <Link
    href={`/equipos/${equipo.id}`}
    className="inline-block rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
  >
    Ver detalles
  </Link>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-sm text-slate-500">
          BioMedManager - Prototipo académico
        </p>
      </div>
    </main>
  );
}
