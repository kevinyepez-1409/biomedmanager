
"use client";

import { useState, type FormEvent } from "react";

type Estado = "Operativo" | "Con falla" | "Mantenimiento";

type Equipo = {
  codigo: string;
  nombre: string;
  marca: string;
  modelo: string;
  ubicacion: string;
  estado: Estado;
};

// Demo data. Database integration will come later.
const equiposIniciales: Equipo[] = [
  {
    codigo: "BM-001",
    nombre: "Monitor de signos vitales",
    marca: "Mindray",
    modelo: "Demo",
    ubicacion: "Emergencia",
    estado: "Operativo",
  },
  {
    codigo: "BM-002",
    nombre: "Bomba de infusion",
    marca: "B. Braun",
    modelo: "Demo",
    ubicacion: "Hospitalizacion",
    estado: "Con falla",
  },
  {
    codigo: "BM-003",
    nombre: "Electrocardiografo",
    marca: "GE",
    modelo: "Demo",
    ubicacion: "Consulta externa",
    estado: "Mantenimiento",
  },
];

export default function Home() {
  const [equipos, setEquipos] = useState(equiposIniciales);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const operativos = equipos.filter(
    (equipo) => equipo.estado === "Operativo"
  ).length;

  function registrarEquipo(evento: FormEvent<HTMLFormElement>) {
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

    if (equipos.some((equipo) => equipo.codigo === codigo)) {
      setError("Ya existe un equipo con ese codigo.");
      return;
    }

    if (!["Operativo", "Con falla", "Mantenimiento"].includes(estado)) {
      setError("Selecciona un estado valido.");
      return;
    }

    const nuevoEquipo: Equipo = {
      codigo,
      nombre,
      marca,
      modelo,
      ubicacion,
      estado,
    };

    setEquipos((actuales) => [...actuales, nuevoEquipo]);
    formulario.reset();
    setMostrarFormulario(false);
    setMensaje(`Equipo ${codigo} agregado correctamente.`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-blue-800">
          BioMedManager
        </h1>
        <p className="text-sm text-slate-500">
          Sistema de gestion de equipamiento biomedico
        </p>
      </header>

      <div className="mx-auto max-w-6xl p-8">
        <h2 className="text-3xl font-semibold">Panel principal</h2>
        <p className="mt-2 mb-8 text-slate-500">
          Inventario y estado de equipos medicos
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

          {mostrarFormulario && (
            <form onSubmit={registrarEquipo} className="mb-8 rounded-lg bg-slate-100 p-5">
              <h4 className="mb-4 font-semibold">
                Registrar nuevo equipo
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  Codigo
                  <input name="codigo" required
                    className="mt-1 w-full rounded border bg-white p-3"
                    placeholder="Ej. BM-004" />
                </label>

                <label className="block">
                  Nombre del equipo
                  <input name="nombre" required
                    className="mt-1 w-full rounded border bg-white p-3"
                    placeholder="Ej. Desfibrilador" />
                </label>

                <label className="block">
                  Marca
                  <input name="marca" required
                    className="mt-1 w-full rounded border bg-white p-3"
                    placeholder="Ej. Philips" />
                </label>

                <label className="block">
                  Modelo
                  <input name="modelo" required
                    className="mt-1 w-full rounded border bg-white p-3"
                    placeholder="Ej. Modelo A" />
                </label>

                <label className="block">
                  Ubicacion
                  <input name="ubicacion" required
                    className="mt-1 w-full rounded border bg-white p-3"
                    placeholder="Ej. UCI" />
                </label>

                <label className="block">
                  Estado
                  <select name="estado"
                    className="mt-1 w-full rounded border bg-white p-3">
                    <option>Operativo</option>
                    <option>Con falla</option>
                    <option>Mantenimiento</option>
                  </select>
                </label>
              </div>

              {error && (
                <p className="mt-4 text-red-600">{error}</p>
              )}

              <button type="submit"
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800">
                Guardar equipo
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4">Codigo</th>
                  <th className="p-4">Equipo</th>
                  <th className="p-4">Ubicacion</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>

              <tbody>
                {equipos.map((equipo) => (
                  <tr key={equipo.codigo} className="border-t">
                    <td className="p-4">{equipo.codigo}</td>
                    <td className="p-4">{equipo.nombre}</td>
                    <td className="p-4">{equipo.ubicacion}</td>
                    <td className="p-4">{equipo.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-sm text-slate-500">
          Prototipo academico - Datos de demostracion
        </p>
      </div>
    </main>
  );
}
