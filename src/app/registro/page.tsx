"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { Aviso } from "@/components/Aviso";
import { botonPrimario, campo, etiqueta } from "@/components/estilos";

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
    <MarcoAcceso
      titulo="Crear cuenta"
      subtitulo="Cada cuenta tiene su propio inventario de equipos."
    >
      {correoEnviado ? (
        <Aviso tipo="exito">
          <p>
            Te enviamos un correo a <strong>{correoEnviado}</strong>.
          </p>
          <p className="mt-2">
            Abre el enlace del mensaje en este mismo navegador para activar tu cuenta. Si no lo ves,
            revisa la carpeta de spam.
          </p>
          <p className="mt-2">
            Si el enlace no te deja entrar, tu cuenta puede estar ya confirmada: inicia sesión con tu
            correo y contraseña.
          </p>
        </Aviso>
      ) : (
        <form onSubmit={registrarse} className="space-y-5">
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
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={LONGITUD_MINIMA}
              autoComplete="new-password"
              placeholder={`Mínimo ${LONGITUD_MINIMA} caracteres`}
              className={campo}
            />
          </label>

          <label className={etiqueta}>
            Repite la contraseña
            <input
              type="password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              required
              autoComplete="new-password"
              className={campo}
            />
          </label>

          {error && <Aviso tipo="error">{error}</Aviso>}

          <button type="submit" disabled={cargando} className={`${botonPrimario} w-full py-3`}>
            {cargando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-marca-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </MarcoAcceso>
  );
}
