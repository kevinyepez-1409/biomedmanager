# BioMedManager: diagnóstico, alcance definitivo e indicaciones técnicas

**Fecha:** 25 de noviembre de 2026
**Base:** inspección real del repositorio y de Supabase (vía MCP en modo solo lectura), documento maestro y plantilla `PlantillaModelodeNegocioCANVAS_IIS2026_PA.pptx`.

> Este documento sustituye las suposiciones del documento maestro. Todo lo marcado como **verificado** se comprobó en código, base de datos o registros; lo marcado como **pendiente** no existe todavía.

---

## 1. Diagnóstico

### 1.1 Requisitos del curso frente al estado real

La plantilla nueva pide ocho entregables. Este es el estado de cada uno:

| Entregable (plantilla PA) | Estado real | Qué falta |
| --- | --- | --- |
| Business Model Canvas | Existe una versión antigua | Ajustar la propuesta de valor, el segmento y la competencia (sección 4) |
| Herramientas con versión | Versiones verificadas (sección 5) | Pasarlas a la diapositiva |
| Uso de IA en el desarrollo | No documentado | Declarar las herramientas, el porcentaje aproximado y un prompt de ejemplo; contestar honestamente que **la app no usa IA internamente** |
| Casos de uso | **Hecho:** `docs/uml/` | Usar el diagrama «MVP final» solo cuando todo esté implementado |
| Capturas del producto | Pendiente | Tomarlas al terminar el rediseño |
| Video de 3 minutos | Lo hace el usuario | Guion sugerido en la sección 3.4 |
| Proyecto en GitHub | **No hay remoto** | Crear el repositorio y subir el código |
| Código reproducible en otro equipo | Parcial: el esquema ya está versionado en `supabase/sql/` | Añadir `.env.example`, README con instalación y los scripts SQL en orden |

Criterios de la guía original («Su MVP debe cumplir»), todavía vigentes:

| Criterio | Estado |
| --- | --- |
| Un flujo principal de punta a punta | Verificado: login → inventario → reporte → historial |
| Registro e inicio de sesión | **Verificado** (commit `6f98853` y siguientes); con confirmación de correo |
| Datos en BD mediante API | Verificado: API REST de Supabase con RLS |
| Regla de «validación de salud» | **Pendiente:** el script `supabase/sql/001_regla_fallas.sql` está escrito pero **no aplicado** |
| Desplegado por enlace web | Pendiente (Vercel) |
| Cinco usuarios y cambios documentados | Pendiente |

### 1.2 Hallazgos técnicos verificados

- **Seguridad entre cuentas: correcta.** RLS en `equipos` y `reportes`, sin acceso anónimo y sin `DELETE`. No se puede reportar sobre un equipo ajeno: la política de inserción lo comprueba.
- **Debilidad menor:** en `equipos` se puede hacer `UPDATE` de cualquier columna, incluidas `id`, `usuario_id` y `creado_en`. El script `001` lo restringe.
- **No hay triggers.** Una falla no cambia el estado del equipo y nada impide marcar «Operativo» un equipo con fallas pendientes.
- **Datos actuales:** 4 equipos, 0 reportes y 2 cuentas (Gmail con los datos; Yachay vacía, ya confirmada).
- **Correo de confirmación:** el envío funciona, pero el filtro de seguridad del correo institucional abre el enlace antes que la persona (comprobado en los registros de Auth). Sin un SMTP propio, Supabase solo envía a los miembros del equipo de Supabase y con un límite muy bajo, así que **los cinco probadores no recibirían el correo**.
- **Advisor de seguridad:** avisa sobre `rls_auto_enable()`, una función de Supabase para el trigger de eventos que activa RLS en tablas nuevas. No es explotable y no se toca. La protección contra contraseñas filtradas es una función del plan de pago.
- **Build, lint y TypeScript:** sin errores. `npm audit --omit=dev`: 0 vulnerabilidades (Next 16.4.6).

### 1.3 ¿Mantener la dirección o cambiarla?

**Se mantiene el dominio, el stack y la arquitectura.** Se mantiene también la ruta B, «ciclo de falla cerrado», con tres añadidos justificados:

1. **Exportar a Excel.** Lo pidió el usuario y además se justifica: la competencia real es la hoja de cálculo, y exportar permite convivir con ella en vez de pedir al cliente que la abandone. Se hace en el navegador, con los datos que RLS ya filtra, sin backend nuevo.
2. **Indicadores de mantenimiento.** Disponibilidad del inventario, fallas pendientes, falla abierta más antigua y **MTTR** (tiempo medio de reparación). Es un indicador clásico de la ingeniería clínica, se calcula con los datos del ciclo de falla y no tiene costo.
3. **Etiqueta QR por equipo.** Al escanearla con el celular se abre la ficha del equipo para reportar la falla donde ocurre. Queda muy bien en un video de 3 minutos y es una sola librería pequeña.

**Inteligencia artificial: no se incluye en la app.** Razones:

- Exige una clave secreta en el servidor (una ruta API nueva), costo por uso y una cuenta de pago.
- Clasificar o redactar fallas con un LLM no mejora la regla de salud, que es determinista.
- El documento maestro la excluía expresamente.
- La plantilla solo pregunta *si* la app usa IA. «No» es una respuesta válida y honesta.

Lo que sí hay que declarar con precisión es **el uso de IA en el desarrollo** (Claude y Claude Code), con el porcentaje real. Es alto, así que debe decirse sin minimizarlo.

**Se descartan:** inventario compartido con roles (requiere rehacer RLS), mantenimiento preventivo con agenda, borrado de registros, PDF, recuperación de contraseña y la «Next.js API» propia.

---

## 2. Alcance definitivo del MVP

| Funcionalidad | Estado | Dónde se impone |
| --- | --- | --- |
| Registro, confirmación de correo, login y logout | Hecho | Supabase Auth + `proxy.ts` |
| Inventario con búsqueda y filtro por estado | Pendiente (el listado ya existe) | UI |
| Registrar equipo (estado inicial: Operativo o Mantenimiento) | Hecho, falta ajustar los estados | UI + CHECK |
| Editar los datos del equipo (nombre, marca, modelo, ubicación) | Pendiente | UI + permisos por columna |
| Ficha con historial | Hecho | RLS |
| Reportar una Falla u Observación; la Falla pasa el equipo a «Con falla» | Pendiente (el reporte existe; la regla no) | **Trigger** |
| Cambiar el estado; bloqueo de «Operativo» con fallas pendientes | Pendiente | **Trigger** + mensaje en la UI |
| Resolver un reporte con nota de cierre y fecha automática | Pendiente | **Trigger + CHECK** |
| Panel de indicadores (disponibilidad, pendientes, MTTR, falla más antigua) | Pendiente | UI (cálculo en el cliente) |
| Exportar a Excel (hoja Inventario + hoja Reportes) | Pendiente | UI (`write-excel-file`) |
| Etiqueta QR imprimible | Pendiente | UI (`qrcode`) |
| Diseño profesional y consistente | Pendiente | UI (Tailwind, sin librerías de componentes) |
| Despliegue en Vercel con SMTP propio | Pendiente | Configuración |
| README, `.env.example`, guía de pruebas | Pendiente | Docs |

---

## 3. Indicaciones técnicas para Claude Code

### 3.1 Reglas de trabajo

- **No** reescribir el stack ni migrar a Server Components o Server Actions: los componentes cliente con Supabase y RLS son la arquitectura correcta para este MVP.
- **No** crear rutas API propias ni usar una clave `service_role`.
- Leer la guía de `node_modules/next/dist/docs/` que corresponda antes de usar APIs de Next 16 (`AGENTS.md`). Con `cacheComponents`, cualquier página que use `useParams` necesita `loading.tsx` o `Suspense`.
- La base de datos se modifica **solo con scripts numerados** en `supabase/sql/`, aprobados por el usuario y ejecutados en el SQL Editor. El MCP de Supabase está en modo solo lectura y sirve para verificar.
- Un commit por etapa, con build y lint sin errores antes de cada uno.
- Las dependencias nuevas autorizadas son solo `write-excel-file@4.1.1` y `qrcode@1.5.4` (ya instaladas, sin vulnerabilidades).
- Al usuario: un paso manual a la vez, en español, indicando dónde hacerlo (terminal, editor, SQL Editor o navegador).

### 3.2 Etapas

| # | Etapa | Archivos | Aceptación |
| --- | --- | --- | --- |
| 5a | **Aplicar la regla en la BD:** el usuario ejecuta `001_regla_fallas.sql` (ya escrito, sin aplicar) y luego `900_pruebas_regla.sql` (por escribir: casos 1-10 en una transacción con usuarios simulados y limpieza final) | `supabase/sql/` | Todas las pruebas devuelven OK; el MCP confirma los triggers |
| 5b | **Capa de datos:** tipos, consultas, traducción de errores (`EQUIPO_CON_FALLAS_PENDIENTES`, `REPORTE_YA_RESUELTO`, 23505, 23514, 42501) e indicadores | `src/lib/` | `tsc` limpio |
| 5c | **Componentes:** encabezado, insignia de estado, tarjeta de indicador, estados vacíos y de carga | `src/components/` | Reutilizados en todas las páginas |
| 5d | **Panel:** indicadores, «requiere atención», inventario con búsqueda y filtro, alta, exportar a Excel | `src/app/page.tsx`, `src/lib/exportar.ts` | El archivo .xlsx se abre en Excel con 2 hojas |
| 5e | **Ficha:** cambio de estado con la regla, edición de datos, reporte, resolución con nota, historial tipo línea de tiempo y botón de QR | `src/app/equipos/[id]/` | Pasan los 8 casos de la sección 3.3 desde la UI |
| 5f | **Etiqueta QR:** página imprimible | `src/app/equipos/[id]/etiqueta/` | El QR leído con el celular abre la ficha (después del login) |
| 5g | **Login y registro:** mismo lenguaje visual, título por página, ícono de la app | `src/app/login`, `registro`, `layout.tsx`, `globals.css` | Se ve bien en el celular (375 px) |
| 6 | **Despliegue:** GitHub, Vercel, variables, Site URL y Redirect URLs en Supabase, SMTP propio | Configuración | La URL funciona en incógnito y en el celular; un correo externo recibe la confirmación |
| 7 | **Pruebas con 5 usuarios:** guion, plantilla y dos oleadas (2 personas y luego 3) | `docs/pruebas/` | 5 hojas reales y una tabla de cambios con su commit |
| 8 | **Documentación:** README (instalación reproducible), arquitectura, pipeline y textos de las diapositivas | `README.md`, `docs/` | Otra persona instala y ejecuta la app siguiendo solo el README |

### 3.3 Casos de prueba de la regla de salud

| # | Caso | Esperado |
| --- | --- | --- |
| 1 | Equipo Operativo + Observación | Sigue Operativo |
| 2 | Equipo Operativo + Falla | Pasa a «Con falla» |
| 3 | Con falla pendiente → Operativo (UI) | Rechazado, con el mensaje «tiene N fallas pendientes» |
| 4 | Lo mismo con una llamada directa a la API | Rechazado por el trigger |
| 5 | Con falla pendiente → Mantenimiento | Permitido |
| 6 | Resolver sin nota | Rechazado (CHECK) |
| 7 | Resolver con nota → Operativo | Permitido; `resuelto_en` lo asigna la BD |
| 8 | Modificar un reporte ya resuelto | Rechazado |
| 9 | La cuenta B reporta sobre un equipo de la cuenta A | Rechazado (RLS) |
| 10 | Cambiar `creado_en` de un equipo | Rechazado (sin permiso de columna) |

### 3.4 Guion sugerido para el video (3 minutos, lo graba el usuario)

1. **0:00–0:20.** El problema: inventarios en Excel donde un equipo con falla figura como disponible.
2. **0:20–0:50.** Registro y login. Inventario con indicadores.
3. **0:50–1:40.** Reportar una falla: el equipo pasa a «Con falla». Intentar marcarlo «Operativo»: **la app lo bloquea**. Resolver la falla con nota y marcarlo Operativo.
4. **1:40–2:10.** Historial, indicadores (MTTR) y exportación a Excel.
5. **2:10–2:40.** Etiqueta QR: escanearla con el celular y abrir la ficha.
6. **2:40–3:00.** Arquitectura en una frase y limitaciones honestas.

---

## 4. Ajustes al Canvas y a las diapositivas

- **Propuesta de valor:** «Saber en todo momento qué equipos están fuera de servicio, por qué y desde cuándo, sin que ninguno con una falla abierta figure como disponible».
- **Segmento inicial:** clínicas pequeñas y centros de salud donde una persona responde por los equipos. Los hospitales públicos quedan como visión a largo plazo, porque compran por contratación pública.
- **Competencia real:** hojas de cálculo y grupos de WhatsApp.
- **Costos:** $0 en el MVP (planes gratuitos de Supabase y Vercel; el plan Hobby de Vercel es solo para uso no comercial).
- **Ingresos:** hipótesis sin validar (suscripción por institución o por número de equipos).
- **Arquitectura:** Navegador → Next.js (Vercel) → API REST de Supabase → PostgreSQL con RLS y triggers. **Sin** «Next.js API».
- **Uso de IA (diapositiva 4):** herramientas Claude y Claude Code; usos: diseño, auditoría, código, SQL y diagramas. Indicar el porcentaje real. ¿La app usa IA internamente? **No.**

---

## 5. Herramientas y versiones verificadas

| Categoría | Herramienta | Versión |
| --- | --- | --- |
| Lenguaje / framework | TypeScript · Next.js (App Router) · React | 5.9.3 · 16.4.6 · 19.3.0 |
| Estilos | Tailwind CSS | 4.3.3 |
| Base de datos / backend | Supabase (PostgreSQL + Auth + API REST) · `@supabase/supabase-js` · `@supabase/ssr` | 2.118.0 · 0.12.7 |
| Entorno | Node.js · npm · Git | 24.22.0 · 11.19.1 · 2.51.0 |
| Editor | Visual Studio Code | (el usuario la confirma) |
| Librerías del MVP | `write-excel-file` (Excel) · `qrcode` (etiquetas) | 4.1.1 · 1.5.4 |
| Despliegue | Vercel (pendiente) · GitHub (pendiente) | — |
| Diagramas | PlantUML (fuente) · SVG/PNG generados | — |
