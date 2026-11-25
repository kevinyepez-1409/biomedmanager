// Traduce los errores de Supabase/PostgreSQL a mensajes comprensibles.
// Los codigos propios los lanzan los triggers de supabase/sql/001.

type ErrorSupabase = {
  code?: string;
  message?: string;
  details?: string | null;
};

export function mensajeDeError(error: unknown, contexto = "la operación"): string {
  if (!error || typeof error !== "object") {
    return `No se pudo completar ${contexto}. Inténtalo de nuevo.`;
  }

  const { code, message = "", details } = error as ErrorSupabase;

  if (message.includes("EQUIPO_CON_FALLAS_PENDIENTES")) {
    const n = Number(details) || 1;
    return `No se puede marcar como Operativo: el equipo tiene ${n} ${
      n === 1 ? "falla pendiente" : "fallas pendientes"
    }. Resuélvelas primero.`;
  }

  if (message.includes("REPORTE_YA_RESUELTO")) {
    return "Este reporte ya fue resuelto y no se puede modificar.";
  }

  switch (code) {
    case "23505":
      return "Ya existe un equipo con ese código en tu inventario.";
    case "23514":
      return "Algún dato no cumple las reglas: revisa los campos obligatorios y la longitud de los textos.";
    case "42501":
      return "No tienes permiso para realizar esta acción.";
    case "22P02":
    case "PGRST116":
      return "El equipo no existe o no pertenece a tu inventario.";
  }

  if (message.toLowerCase().includes("fetch")) {
    return "Error de conexión. Comprueba tu internet e inténtalo de nuevo.";
  }

  return `No se pudo completar ${contexto}. Inténtalo de nuevo.`;
}
