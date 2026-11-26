import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinoSeguro } from "@/lib/destino";

// Destino del enlace de confirmacion de correo. Acepta dos formatos:
//
// 1. ?code=...  -> plantilla por defecto de Supabase (sin SMTP propio).
//    El registro envia emailRedirectTo = <origen>/auth/confirm.
//    Solo funciona en el MISMO navegador donde se hizo el registro,
//    porque necesita el "code verifier" guardado en sus cookies.
//
// 2. ?token_hash=...&type=... -> plantillas personalizadas (requiere SMTP):
//    Confirm signup:  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
//    Reset password:  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nueva-contrasena
//    Funciona aunque el correo se abra en otro navegador o dispositivo.
//
// El parametro opcional ?next= indica a donde ir despues (solo rutas internas).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  // Destino tras confirmar (p. ej. /nueva-contrasena al recuperar la clave).
  const next = destinoSeguro(params.get("next"));
  const exito = NextResponse.redirect(new URL(next, request.url));
  const fallo = NextResponse.redirect(new URL("/auth/error", request.url));

  if (!code && !(tokenHash && type)) {
    return fallo;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Guardar la sesion recien creada en la respuesta de exito.
          cookiesToSet.forEach(({ name, value, options }) => {
            exito.cookies.set(name, value, options);
          });

          Object.entries(headers ?? {}).forEach(([key, value]) => {
            exito.headers.set(key, value);
          });
        },
      },
    }
  );

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        type: type!,
        token_hash: tokenHash!,
      });

  return error ? fallo : exito;
}
