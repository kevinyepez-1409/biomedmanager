import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Destino del enlace de confirmacion de correo.
// La plantilla "Confirm signup" de Supabase debe apuntar a:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
// Funciona aunque el correo se abra en otro navegador o dispositivo.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  const exito = NextResponse.redirect(new URL("/", request.url));
  const fallo = NextResponse.redirect(new URL("/auth/error", request.url));

  if (!tokenHash || !type) {
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

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  return error ? fallo : exito;
}
