"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const LONGITUD_MINIMA = 8;

// Translate Supabase Auth error codes into clear messages.
function mensajeDeError(codigo: string | undefined): string {
  switch (codigo) {
    case "user_already_exists":
    case "email_exists":
      return "Ya existe una cuenta con ese correo. Inicia sesión.";
    case "weak_password":
      return `La contraseña es demasiado débil. Usa al menos ${LONGITUD_MINIMA} caracteres.`;
    case "email_address_invalid":
      return "El correo no es válido.";
    case "email_address_not_authorized":
      return "El servidor de correo todavía no puede enviar mensajes a esta dirección. Avisa al responsable de la aplicación.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.";
    case "signup_disabled":
      return "El registro de cuentas nuevas está desactivado.";
    default:
      return "No se pudo crear la cuenta. Inténtalo de nuevo.";
  }
}

export default function RegistroPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [correoEnviado, setCorreoEnviado] = useState("");

  async function registrarse(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");

    const correo = email.trim();

    if (password.length < LONGITUD_MINIMA) {
      setError(
        `La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`
      );
      return;
    }

    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signUp({
        email: correo,
        password,
        options: {
          // Must be listed in Supabase > Authentication > URL Configuration.
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (authError) {
        setError(mensajeDeError(authError.code));
        return;
      }

      // Without email confirmation the session starts immediately.
      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      // With email confirmation, an existing address returns a user
      // without identities instead of an error.
      if (data.user && data.user.identities?.length === 0) {
        setError(mensajeDeError("user_already_exists"));
        return;
      }

      setCorreoEnviado(correo);
      setPassword("");
      setConfirmacion("");
    } catch {
      setError("Error de conexión. Comprueba tu internet e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-800">BioMedManager</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestión de equipamiento biomédico
          </p>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-slate-800">
          Crear cuenta
        </h2>

        {correoEnviado ? (
          <div
            role="status"
            className="rounded-lg bg-green-50 p-4 text-sm text-green-800"
          >
            <p>
              Te enviamos un correo a <strong>{correoEnviado}</strong>.
            </p>
            <p className="mt-2">
              Abre el enlace del mensaje en este mismo navegador para activar
              tu cuenta. Si no lo ves, revisa la carpeta de spam.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-500">
              Cada cuenta tiene su propio inventario de equipos.
            </p>

            <form onSubmit={registrarse} className="space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                Correo electrónico
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
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={LONGITUD_MINIMA}
                  autoComplete="new-password"
                  placeholder={`Mínimo ${LONGITUD_MINIMA} caracteres`}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Repite la contraseña
                <input
                  type="password"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {cargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-blue-700 hover:underline">
            Inicia sesión
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-slate-400">
          BioMedManager - Prototipo académico
        </p>
      </div>
    </main>
  );
}
