import Link from "next/link";

export default function ErrorConfirmacion() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-800">BioMedManager</h1>

        <h2 className="mt-6 text-xl font-semibold">
          No se pudo confirmar tu correo
        </h2>

        <p className="mt-3 text-sm text-slate-600">
          El enlace no es válido, ya se usó o expiró. Algunos correos
          institucionales revisan los enlaces automáticamente y eso puede
          confirmar tu cuenta antes de que hagas clic: prueba primero a
          iniciar sesión con tu correo y contraseña. Si no puedes entrar,
          vuelve a registrarte para recibir un enlace nuevo.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
          >
            Registrarme
          </Link>
        </div>
      </div>
    </main>
  );
}
