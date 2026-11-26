// Genera las versiones visuales (SVG) de los diagramas de casos de uso.
// Uso:  node docs/uml/generar_svg.mjs
// Sin dependencias. Las fuentes editables son los archivos .puml; este
// script dibuja el mismo contenido con un estilo uniforme para diapositivas.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));

const RX = 98;
const RY = 27;

const esc = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function texto(x, y, lineas, { size = 13, weight = 400, anchor = "middle", color = "#2B2118" } = {}) {
  const alto = size * 1.2;
  const y0 = y - ((lineas.length - 1) * alto) / 2 + size * 0.35;
  return lineas
    .map(
      (l, i) =>
        `<text x="${x}" y="${(y0 + i * alto).toFixed(1)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${color}">${esc(l)}</text>`
    )
    .join("");
}

// Punto del borde de la elipse en direccion a (tx, ty).
function borde(cx, cy, tx, ty, rx = RX, ry = RY) {
  const dx = tx - cx;
  const dy = ty - cy;
  const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
  return [cx + dx * t, cy + dy * t];
}

function actor(a) {
  const { x, y, nombre } = a;
  const c = "#5A3A26";
  return `<g stroke="${c}" stroke-width="2" fill="none">
    <circle cx="${x}" cy="${y - 38}" r="11" fill="#FCE3CC"/>
    <line x1="${x}" y1="${y - 27}" x2="${x}" y2="${y + 5}"/>
    <line x1="${x - 18}" y1="${y - 16}" x2="${x + 18}" y2="${y - 16}"/>
    <line x1="${x}" y1="${y + 5}" x2="${x - 15}" y2="${y + 30}"/>
    <line x1="${x}" y1="${y + 5}" x2="${x + 15}" y2="${y + 30}"/>
  </g>${texto(x, y + 50 + (nombre.length - 1) * 8, nombre, { size: 13, weight: 700 })}`;
}

function generar(spec) {
  const casos = Object.fromEntries(spec.casos.map((c) => [c.id, c]));
  const actores = Object.fromEntries(spec.actores.map((a) => [a.id, a]));
  const partes = [];

  // Marco y limite del sistema.
  partes.push(
    `<rect x="8" y="8" width="${spec.ancho - 16}" height="${spec.alto - 16}" fill="#FFFFFF" stroke="#5A3A26" stroke-width="1.2"/>`,
    `<path d="M8 8 H260 V26 L248 38 H8 Z" fill="#F4EDE7" stroke="#5A3A26" stroke-width="1.2"/>`,
    texto(18, 23, [spec.titulo], { size: 13, weight: 700, anchor: "start" }),
    `<rect x="${spec.limite.x}" y="${spec.limite.y}" width="${spec.limite.w}" height="${spec.limite.h}" rx="6" fill="#FFFDFB" stroke="#8A7A6E" stroke-width="1.4"/>`,
    texto(spec.limite.x + spec.limite.w / 2, spec.limite.y + 22, ["BioMedManager"], { size: 15, weight: 700 })
  );

  // Asociaciones actor - caso de uso.
  for (const [idActor, idCaso, etiqueta, opciones = {}] of spec.asociaciones) {
    const a = actores[idActor];
    const c = casos[idCaso];
    const ax = a.x + (c.x > a.x ? 22 : -22);
    const ay = a.y - 10;
    const [bx, by] = borde(c.x, c.y, ax, ay);
    partes.push(`<line x1="${ax}" y1="${ay}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#5A3A26" stroke-width="1.3"/>`);
    if (etiqueta) {
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2 + (opciones.debajo ? 24 : -26);
      const ancho = Math.max(...etiqueta.map((l) => l.length)) * 6.2 + 10;
      partes.push(
        `<rect x="${(mx - ancho / 2).toFixed(1)}" y="${(my - etiqueta.length * 8 - 1).toFixed(1)}" width="${ancho.toFixed(1)}" height="${etiqueta.length * 14 + 3}" rx="3" fill="#FFFDFB"/>`,
        texto(mx, my, etiqueta, { size: 11, color: "#5A3A26" })
      );
    }
  }

  // Casos de uso.
  for (const c of spec.casos) {
    partes.push(
      `<ellipse cx="${c.x}" cy="${c.y}" rx="${RX}" ry="${RY}" fill="url(#relleno)" stroke="#8A5A3B" stroke-width="1.5"/>`,
      texto(c.x, c.y, c.etiqueta.split("\n"), { size: 13 })
    );
  }

  // Relaciones <<include>> / <<extend>> (flecha punteada hacia "hacia").
  for (const r of spec.relaciones) {
    const desde = casos[r.desde];
    const hacia = casos[r.hacia];
    const [x1, y1] = borde(desde.x, desde.y, hacia.x, hacia.y);
    const [x2, y2] = borde(hacia.x, hacia.y, desde.x, desde.y);
    partes.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#3B2A1E" stroke-width="1.6" stroke-dasharray="7 5" marker-end="url(#flecha)"/>`
    );
    const lineas = [`«${r.tipo}»`, ...(r.condicion ? [r.condicion] : [])];
    // Etiqueta un poco mas cerca del caso que extiende/incluye, para no
    // tapar el borde de la elipse destino.
    const mx = x2 + (x1 - x2) * 0.58;
    const desplazamiento = 8 + lineas.length * 8;
    const my = y2 + (y1 - y2) * 0.58 + (r.debajo ? desplazamiento + 6 : -desplazamiento);
    // Sin fondo: la etiqueta ya queda separada de la linea.
    partes.push(
      texto(mx, my, lineas, { size: 11, color: "#3B2A1E" })
    );
  }

  for (const a of spec.actores) partes.push(actor(a));

  // Nota.
  if (spec.nota) {
    const { x, y, w, lineas } = spec.nota;
    const h = lineas.length * 16 + 18;
    partes.push(
      `<path d="M${x} ${y} H${x + w - 14} L${x + w} ${y + 14} V${y + h} H${x} Z" fill="#FFF8D9" stroke="#8A7A6E" stroke-width="1.2"/>`,
      `<path d="M${x + w - 14} ${y} V${y + 14} H${x + w}" fill="none" stroke="#8A7A6E" stroke-width="1.2"/>`,
      texto(x + 14, y + h / 2, lineas, { size: 12, anchor: "start" })
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${spec.ancho}" height="${spec.alto}" viewBox="0 0 ${spec.ancho} ${spec.alto}" font-family="Arial, Helvetica, sans-serif">
<title>${esc(spec.tituloAccesible)}</title>
<defs>
  <linearGradient id="relleno" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFF3E8"/>
    <stop offset="1" stop-color="#F6C9A1"/>
  </linearGradient>
  <marker id="flecha" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
    <path d="M1 1 L11 6 L1 11" fill="none" stroke="#3B2A1E" stroke-width="1.6"/>
  </marker>
</defs>
<rect width="100%" height="100%" fill="#FFFFFF"/>
${partes.join("\n")}
</svg>
`;
}

const SEP_B = 305;

// Coloca los casos de la columna A en un arco alrededor del Responsable
// tecnico, para que sus lineas no atraviesen otros casos de uso; los de la
// columna B quedan a la derecha de su caso base.
function arco(yActor, y, radio, xActor = 95) {
  const dy = y - yActor;
  return Math.round(xActor + Math.sqrt(Math.max(radio ** 2 - dy ** 2, 0)));
}

function colocar(spec) {
  const resp = spec.actores.find((a) => a.id === "tec");
  for (const c of spec.casos) {
    if (c.col === "A") c.x = c.fijoX ?? arco(resp.y, c.y, spec.radio);
  }
  for (const c of spec.casos) {
    if (c.col === "B") c.x = spec.casos.find((b) => b.id === c.base).x + SEP_B;
  }
  return spec;
}

// Informa si alguna linea de asociacion atraviesa un caso de uso ajeno.
function conflictos(spec) {
  const casos = Object.fromEntries(spec.casos.map((c) => [c.id, c]));
  const actores = Object.fromEntries(spec.actores.map((a) => [a.id, a]));
  const errores = [];
  for (const [idActor, idCaso] of spec.asociaciones) {
    const a = actores[idActor];
    const c = casos[idCaso];
    const ax = a.x + (c.x > a.x ? 22 : -22);
    const ay = a.y - 10;
    for (const otro of spec.casos) {
      if (otro.id === idCaso) continue;
      for (let k = 0; k <= 400; k++) {
        const t = k / 400;
        const x = ax + (c.x - ax) * t;
        const y = ay + (c.y - ay) * t;
        if (((x - otro.x) / (RX + 4)) ** 2 + ((y - otro.y) / (RY + 4)) ** 2 < 1) {
          errores.push(`${idActor}->${idCaso} cruza ${otro.id}`);
          break;
        }
      }
    }
  }
  return errores;
}

const ACTORES = (yResp, xAuth) => [
  { id: "vis", x: 95, y: 190, nombre: ["Visitante"] },
  { id: "tec", x: 95, y: yResp, nombre: ["Responsable", "técnico"] },
  { id: "auth", x: xAuth, y: 250, nombre: ["Supabase Auth", "(servicio de correo)", "«sistema»"] },
];

// ---------------------------------------------------------------------
// Diagrama de casos de uso (funcionalidades implementadas).
// ---------------------------------------------------------------------
const diagrama = colocar({
  titulo: "uc Casos de uso — BioMedManager",
  tituloAccesible: "BioMedManager - diagrama de casos de uso",
  ancho: 1320,
  alto: 1300,
  radio: 600,
  limite: { x: 230, y: 55, w: 900, h: 1130 },
  actores: ACTORES(745, 1225),
  casos: [
    { id: "reg", col: "A", fijoX: 440, y: 120, etiqueta: "Registrarse" },
    { id: "conf", col: "A", fijoX: 440, y: 190, etiqueta: "Confirmar correo\nelectrónico" },
    { id: "rec", col: "A", fijoX: 440, y: 260, etiqueta: "Recuperar\ncontraseña" },
    { id: "ini", col: "A", y: 350, etiqueta: "Iniciar sesión" },
    { id: "cer", col: "A", y: 420, etiqueta: "Cerrar sesión" },
    { id: "pan", col: "A", y: 490, etiqueta: "Consultar panel\nde indicadores" },
    { id: "inv", col: "A", y: 575, etiqueta: "Consultar\ninventario" },
    { id: "fil", col: "B", base: "inv", y: 530, etiqueta: "Buscar y filtrar\nequipos" },
    { id: "xls", col: "B", base: "inv", y: 620, etiqueta: "Exportar inventario\na Excel" },
    { id: "alta", col: "A", y: 665, etiqueta: "Registrar equipo" },
    { id: "edit", col: "A", y: 735, etiqueta: "Editar datos\ndel equipo" },
    { id: "ficha", col: "A", y: 830, etiqueta: "Consultar ficha\ndel equipo" },
    { id: "hist", col: "B", base: "ficha", y: 760, etiqueta: "Consultar historial\nde reportes" },
    { id: "traz", col: "B", base: "ficha", y: 830, etiqueta: "Consultar trazabilidad\nde estados" },
    { id: "qr", col: "B", base: "ficha", y: 900, etiqueta: "Generar etiqueta QR" },
    { id: "est", col: "A", y: 940, etiqueta: "Cambiar estado\ndel equipo" },
    { id: "ver", col: "B", base: "est", y: 975, etiqueta: "Verificar fallas\npendientes" },
    { id: "rep", col: "A", y: 1035, etiqueta: "Reportar falla\nu observación" },
    { id: "mcf", col: "B", base: "rep", y: 1060, etiqueta: "Marcar equipo\n«Con falla»" },
    { id: "res", col: "A", y: 1130, etiqueta: "Resolver reporte\ncon nota de cierre" },
  ],
  asociaciones: [
    ["vis", "reg"],
    ["vis", "conf"],
    ["vis", "rec"],
    ["tec", "ini"],
    ["tec", "cer"],
    ["tec", "pan"],
    ["tec", "inv"],
    ["tec", "alta"],
    ["tec", "edit"],
    ["tec", "ficha"],
    ["tec", "est"],
    ["tec", "rep"],
    ["tec", "res"],
    ["auth", "reg", ["envía correo", "de confirmación"]],
    ["auth", "rec", ["envía enlace", "de recuperación"]],
    ["auth", "ini", ["valida", "credenciales"], { debajo: true }],
  ],
  relaciones: [
    { tipo: "extend", desde: "fil", hacia: "inv" },
    { tipo: "extend", desde: "xls", hacia: "inv" },
    { tipo: "include", desde: "ficha", hacia: "hist" },
    { tipo: "include", desde: "ficha", hacia: "traz" },
    { tipo: "extend", desde: "qr", hacia: "ficha" },
    { tipo: "include", desde: "est", hacia: "ver" },
    { tipo: "extend", desde: "mcf", hacia: "rep", condicion: "{si el tipo es Falla}", debajo: true },
  ],
  nota: {
    x: 230,
    y: 1205,
    w: 900,
    lineas: [
      "Regla de salud: un equipo con fallas pendientes no puede pasar a «Operativo». Se impone en PostgreSQL",
      "(trigger y permisos), no solo en la interfaz. Cada cambio de estado queda registrado (trazabilidad).",
    ],
  },
});

const errores = conflictos(diagrama);
if (errores.length) {
  console.warn("Lineas que cruzan casos de uso:", errores.join("; "));
  process.exitCode = 1;
}
const ruta = join(AQUI, "casos_de_uso.svg");
writeFileSync(ruta, generar(diagrama), "utf8");
console.log("Generado:", ruta);
