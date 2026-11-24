
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const supabase = createClient();

      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError(
          authError.code === "email_not_confirmed"
            ? "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
            : "No se pudo iniciar sesión. Revisa tu correo y contraseña."
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(
        "Error de conexion. Comprueba la configuracion de Supabase."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-800">
            BioMedManager
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Gestion de equipamiento biomedico
          </p>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-slate-800">
          Iniciar sesion
        </h2>

        <p className="mb-6 text-sm text-slate-500">
          Ingresa con tu correo y contraseña.
        </p>

        <form onSubmit={iniciarSesion} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Correo electronico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="correo@ejemplo.com"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contrasena
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Ingresa tu contrasena"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {cargando ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-blue-700 hover:underline">
            Regístrate
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-slate-400">
          BioMedManager - Prototipo academico
        </p>
      </div>
    </main>
  );
}
