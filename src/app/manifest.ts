import type { MetadataRoute } from "next";

// Permite instalar BioMedManager en el celular ("Agregar a la pantalla de
// inicio"): se abre como una app, sin la barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BioMedManager",
    short_name: "BioMed",
    description: "Inventario de equipos biomédicos y seguimiento de fallas",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#156d74",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
