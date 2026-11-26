"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { Aviso } from "@/components/Aviso";
import { botonPrimario, campo, etiqueta } from "@/components/estilos";

export default function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const { error: authError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        // Debe estar permitido en Supabase > Authentication > URL Configuration.
        redirectTo: `${window.location.origin}/auth/confirm?next=/nueva-contrasena`,
      });

      if (authError) {
        setError(
          authError.code === "over_email_send_rate_limit" || authError.code === "over_request_rate_limit"
            ? "Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo."
            : "No se pudo enviar el correo. Inténtalo más tarde."
        );
        return;
      }

      // Mismo mensaje exista o no la cuenta: no revela qué correos están registrados.
      setEnviado(true);
    } catch {
      setError("Error de conexión. Comprueba tu internet e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MarcoAcceso
      titulo="Recuperar contraseña"
      subtitulo="Te enviaremos un enlace para elegir una contraseña nueva."
    >
      {enviado ? (
        <Aviso tipo="exito">
          <p>
            Si existe una cuenta con <strong>{email.trim()}</strong>, te enviamos un correo con un enlace para
            cambiar tu contraseña.
          </p>
          <p className="mt-2">Revisa también la carpeta de spam. El enlace caduca en una hora.</p>
        </Aviso>
      ) : (
        <form onSubmit={enviar} className="space-y-5">
          <label className={etiqueta}>
            Correo electrónico de tu cuenta
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

          {error && <Aviso tipo="error">{error}</Aviso>}

          <button type="submit" disabled={enviando} className={`${botonPrimario} w-full py-3`}>
            {enviando ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-slate-600">
        ¿La recordaste?{" "}
        <Link href="/login" className="font-semibold text-marca-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </MarcoAcceso>
  );
}
