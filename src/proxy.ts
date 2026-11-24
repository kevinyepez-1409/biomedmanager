
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const rutaPublica = RUTAS_PUBLICAS.includes(request.nextUrl.pathname);

  // Signed-in users do not need the login or sign-up pages.
  if (rutaPublica) {
    if (!autenticado) return response;

    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    redirectResponse.headers.set("Cache-Control", "private, no-store");

    return redirectResponse;
  }

  if (!autenticado) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );

    // Preserve refreshed cookies when redirecting.
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    redirectResponse.headers.set("Cache-Control", "private, no-store");

    return redirectResponse;
  }

  return response;
}

// Pages for visitors without a session.
const RUTAS_PUBLICAS = ["/login", "/registro"];

// Protect the inventory and equipment detail pages; the public pages
// are included only to send signed-in users to the inventory.
export const config = {
  matcher: ["/", "/equipos/:path*", "/login", "/registro"],
};
