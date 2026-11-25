"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icono } from "./Icono";
import { Logo } from "./Logo";

export function EncabezadoApp({ correo }: { correo?: string }) {
  const router = useRouter();

  async function cerrarSesion() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="no-imprimir sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Ir al panel principal">
          <Logo />
        </Link>

        <div className="flex items-center gap-3">
          {correo && (
            <span className="hidden max-w-56 truncate text-sm text-slate-500 sm:block" title={correo}>
              {correo}
            </span>
          )}
          <button
            type="button"
            onClick={cerrarSesion}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Icono nombre="salir" className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
