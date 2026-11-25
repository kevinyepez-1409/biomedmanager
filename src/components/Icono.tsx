// Iconos de trazo (24x24) dibujados a mano para no agregar dependencias.

const TRAZOS = {
  pulso: "M3 12h4l2-6 4 12 2-6h6",
  salir: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11",
  mas: "M12 5v14M5 12h14",
  buscar: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  descargar: "M12 4v11M7 10l5 5 5-5M5 20h14",
  alerta: "M12 9v4M12 17h.01M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  llave: "M14.7 6.3a4 4 0 0 0 5 5L17 14l-7 7-3-3 7-7 2.7-2.7a4 4 0 0 0-5-5l2.6 2.6-1.6 1.6z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2M20 16v0",
  atras: "M15 18l-6-6 6-6",
  editar: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  cerrar: "M6 6l12 12M18 6L6 18",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  imprimir: "M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z",
  equipo: "M4 5h16v11H4zM8 20h8M12 16v4M7 11h2l1.5-3 2 5 1.5-2h3",
  escudo: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
  grafico: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  nota: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({
  nombre,
  className = "h-5 w-5",
  grosor = 1.8,
}: {
  nombre: NombreIcono;
  className?: string;
  grosor?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
