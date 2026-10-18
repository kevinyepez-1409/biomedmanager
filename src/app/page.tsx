 
const equipos = [
  {
    codigo: "BM-001",
    nombre: "Monitor de signos vitales",
    ubicacion: "Emergencia",
    estado: "Operativo",
  },
  {
    codigo: "BM-002",
    nombre: "Bomba de infusion",
    ubicacion: "Hospitalizacion",
    estado: "Con falla",
  },
  {
    codigo: "BM-003",
    nombre: "Electrocardiografo",
    ubicacion: "Consulta externa",
    estado: "Mantenimiento",
  },
];

export default function Home() {
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
        <h2 className="mb-2 text-3xl font-semibold">
          Panel principal
        </h2>
        <p className="mb-8 text-slate-500">
          Inventario y estado de equipos medicos
        </p>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-6">
            <p className="text-slate-500">Total de equipos</p>
            <p className="mt-2 text-4xl font-bold">3</p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-slate-500">Operativos</p>
            <p className="mt-2 text-4xl font-bold text-green-600">
              1
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-slate-500">Con falla o mantenimiento</p>
            <p className="mt-2 text-4xl font-bold text-orange-600">
              2
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-6">
            <h3 className="text-xl font-semibold">
              Inventario de equipos
            </h3>
          </div>

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

        <p className="mt-6 text-sm text-slate-400">
          Prototipo academico - Datos de demostracion
        </p>
      </div>
    </main>
  );
}
