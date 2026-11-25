const ZONA = "es-EC";

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(ZONA, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function fecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(ZONA, { dateStyle: "medium" });
}

// Duracion legible a partir de milisegundos: "45 min", "6 h", "3,5 días".
export function duracion(ms: number): string {
  const minutos = ms / 60000;
  if (minutos < 60) return `${Math.max(1, Math.round(minutos))} min`;
  const horas = minutos / 60;
  if (horas < 48) return `${horas.toLocaleString(ZONA, { maximumFractionDigits: 1 })} h`;
  const dias = horas / 24;
  return `${dias.toLocaleString(ZONA, { maximumFractionDigits: 1 })} días`;
}

export function desde(iso: string, ahora = Date.now()): string {
  return duracion(ahora - new Date(iso).getTime());
}
