// Valida el parametro "next" para redirigir solo a rutas internas.
// Evita redirecciones abiertas a otros sitios (p. ej. "//malicioso.com").
export function destinoSeguro(valor: string | null | undefined, porDefecto = "/"): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) {
    return porDefecto;
  }
  return valor;
}
