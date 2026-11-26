
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { destinoSeguro } from "@/lib/destino";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Synchronize refreshed session cookies.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers ?? {}).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    }
  );

  // Verify the authentication token.
  const { data, error } = await supabase.auth.getClaims();
  const autenticado = !error && Boolean(data?.claims);

  const { pathname, search } = request.nextUrl;

  // Redirect while keeping refreshed session cookies.
  function redirigir(destino: URL) {
    const redirectResponse = NextResponse.redirect(destino);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  // Signed-in users do not need the login or sign-up pages: send them to
  // where they were going (e.g. the equipment page opened from a QR label).
  if (RUTAS_PUBLICAS.includes(pathname)) {
    if (!autenticado) return response;
    const next = destinoSeguro(request.nextUrl.searchParams.get("next"));
    return redirigir(new URL(next, request.url));
  }

  if (!autenticado) {
    // Remember the requested page so the login can return to it.
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", pathname + search);
    return redirigir(login);
  }

  return response;
}

// Pages for visitors without a session.
const RUTAS_PUBLICAS = ["/login", "/registro", "/recuperar"];

// Protected pages, plus the public ones (only to send signed-in users on).
export const config = {
  matcher: ["/", "/equipos/:path*", "/nueva-contrasena", "/login", "/registro", "/recuperar"],
};
