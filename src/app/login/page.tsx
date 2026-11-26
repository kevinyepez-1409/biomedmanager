"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { Aviso } from "@/components/Aviso";
import { botonPrimario, campo, etiqueta } from "@/components/estilos";
import { destinoSeguro } from "@/lib/destino";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const { error: authError } = await createClient().auth.signInWithPassword({
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

      // Return to the page that required the login (e.g. a scanned QR label).
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(destinoSeguro(next));
      router.refresh();
    } catch {
      setError("Error de conexión. Comprueba tu internet e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <MarcoAcceso titulo="Iniciar sesión" subtitulo="Accede a tu inventario de equipos biomédicos.">
      <form onSubmit={iniciarSesion} className="space-y-5">
        <label className={etiqueta}>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            className={campo}
          />
        </label>

        <label className={etiqueta}>
          <span className="flex items-center justify-between">
            Contraseña
            <Link href="/recuperar" className="text-xs font-medium text-marca-700 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Tu contraseña"
            className={campo}
          />
        </label>

        {error && <Aviso tipo="error">{error}</Aviso>}

        <button type="submit" disabled={cargando} className={`${botonPrimario} w-full py-3`}>
          {cargando ? "Verificando…" : "Ingresar"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-marca-700 hover:underline">
          Regístrate
        </Link>
      </p>
    </MarcoAcceso>
  );
}
