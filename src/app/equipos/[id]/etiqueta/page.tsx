"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { EncabezadoApp } from "@/components/EncabezadoApp";
import { Aviso } from "@/components/Aviso";
import { Icono } from "@/components/Icono";
import { Logo } from "@/components/Logo";
import { botonPrimario, botonSecundario } from "@/components/estilos";
import { mensajeDeError } from "@/lib/errores";
import { COLUMNAS_EQUIPO, type Equipo } from "@/lib/tipos";

// Etiqueta imprimible: al escanear el QR se abre la ficha del equipo
// (previo inicio de sesion), para reportar fallas desde donde esta el equipo.
export default function EtiquetaQR() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [correo, setCorreo] = useState<string>();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!activo) return;
      if (!auth.user) {
        router.replace("/login");
        return;
      }
      setCorreo(auth.user.email ?? undefined);

      const { data, error: dbError } = await supabase
        .from("equipos")
        .select(COLUMNAS_EQUIPO)
        .eq("id", id)
        .single();
      if (!activo) return;
      if (dbError) {
        setError(mensajeDeError(dbError, "la carga del equipo"));
        return;
      }

      const enlace = `${window.location.origin}/equipos/${id}`;
      const imagen = await QRCode.toDataURL(enlace, {
        width: 640,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#0c3a40", light: "#ffffff" },
      });
      if (!activo) return;
      setEquipo(data as Equipo);
      setQr(imagen);
    }

    cargar().catch(() => activo && setError("No se pudo generar la etiqueta."));
    return () => {
      activo = false;
    };
  }, [id, router]);

  return (
    <div className="min-h-screen">
      <EncabezadoApp correo={correo} />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/equipos/${id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-marca-700"
          >
            <Icono nombre="atras" className="h-4 w-4" />
            Volver a la ficha
          </Link>
          {equipo && qr && (
            <div className="flex gap-2">
              <a href={qr} download={`etiqueta_${equipo.codigo}.png`} className={botonSecundario}>
                <Icono nombre="descargar" className="h-4 w-4" />
                Descargar QR
              </a>
              <button type="button" onClick={() => window.print()} className={botonPrimario}>
                <Icono nombre="imprimir" className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4">
            <Aviso tipo="error">{error}</Aviso>
          </div>
        )}

        {equipo && qr ? (
          <>
            <article className="mx-auto mt-8 w-full max-w-sm rounded-3xl border-2 border-dashed border-slate-300 bg-white p-6 text-center print:mt-0 print:border-slate-400">
              <div className="flex justify-center">
                <Logo />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={`Código QR que abre la ficha del equipo ${equipo.codigo}`}
                className="mx-auto mt-5 aspect-square w-56"
              />
              <p className="mt-4 font-mono text-2xl font-bold tracking-wider text-slate-900">{equipo.codigo}</p>
              <p className="mt-1 text-base font-medium text-slate-800">{equipo.nombre}</p>
              <p className="text-sm text-slate-500">
                {equipo.marca} {equipo.modelo} · {equipo.ubicacion}
              </p>
              <p className="mt-4 rounded-xl bg-marca-50 px-3 py-2 text-xs text-marca-900">
                Escanee para ver el estado del equipo o reportar una falla.
              </p>
            </article>
            <p className="no-imprimir mt-6 text-center text-sm text-slate-500">
              Imprime la etiqueta y pégala en el equipo. Quien la escanee deberá iniciar sesión.
            </p>
          </>
        ) : (
          !error && <div className="mx-auto mt-8 h-[30rem] max-w-sm animate-pulse rounded-3xl bg-slate-200/70" />
        )}
      </main>
    </div>
  );
}
