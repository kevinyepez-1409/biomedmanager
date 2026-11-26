"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { Aviso } from "@/components/Aviso";
import { botonPrimario, campo, etiqueta } from "@/components/estilos";

const LONGITUD_MINIMA = 8;

// Se llega aqui desde el enlace del correo de recuperacion, que ya abrio
// la sesion; la pagina esta protegida por proxy.ts.
export default function NuevaContrasena() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");

    if (password.length < LONGITUD_MINIMA) {
      setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA} caracteres.`);
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      const { error: authError } = await createClient().auth.updateUser({ password });
      if (authError) {
        setError(
          authError.code === "same_password"
            ? "La contraseña nueva debe ser distinta de la anterior."
            : authError.code === "weak_password"
              ? `La contraseña es demasiado débil. Usa al menos ${LONGITUD_MINIMA} caracteres.`
              : "No se pudo cambiar la contraseña. Solicita un enlace nuevo e inténtalo otra vez."
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión. Comprueba tu internet e inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <MarcoAcceso titulo="Elige una contraseña nueva" subtitulo="La usarás a partir de ahora para iniciar sesión.">
      <form onSubmit={guardar} className="space-y-5">
        <label className={etiqueta}>
          Contraseña nueva
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

        <button type="submit" disabled={guardando} className={`${botonPrimario} w-full py-3`}>
          {guardando ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </MarcoAcceso>
  );
}
