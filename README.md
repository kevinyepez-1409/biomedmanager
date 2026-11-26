# BioMedManager

Aplicación web para llevar el **inventario de equipos biomédicos** y el **ciclo de vida de sus fallas**: qué equipos están fuera de servicio, por qué y desde cuándo, sin que ninguno con una falla abierta figure como disponible.

> Proyecto académico de Programación Avanzada, Ingeniería Biomédica, Yachay Tech (2026). Es un prototipo: **no es apto para uso clínico real**.

**Aplicación publicada:** <https://biomedmanager.vercel.app>
**Código fuente:** <https://github.com/kevinyepez-1409/biomedmanager>

## Funcionalidades

- **Registro e inicio de sesión** con confirmación de correo y **recuperación de contraseña** (Supabase Auth). Cada cuenta tiene su propio inventario.
- **Panel de indicadores:** disponibilidad (% de equipos operativos), fallas pendientes, equipos fuera de servicio y **MTTR** (tiempo medio de reparación), con gráficos de la distribución por estado y de las fallas por mes.
- **Inventario** con búsqueda, filtro por estado, alta de equipos y lista de equipos que requieren atención.
- **Ficha del equipo:** edición de datos, cambio de estado, reportes de falla u observación, resolución con nota de cierre e historial con tiempos.
- **Regla de salud:** al reportar una falla, el equipo pasa a «Con falla» y **no puede volver a «Operativo» mientras tenga fallas pendientes**. La regla se impone en PostgreSQL (triggers y permisos), no solo en la interfaz.
- **Trazabilidad:** cada cambio de estado (alta, falla reportada, cambio manual) queda registrado con fecha. Lo escribe solo la base de datos y no se puede editar.
- **Exportar a Excel:** un archivo con cuatro hojas (Resumen, Inventario, Reportes y Cambios de estado).
- **Etiqueta QR** imprimible por equipo: al escanearla se abre su ficha; si no hay sesión, después del login vuelve a ese equipo.
- **Instalable en el celular (PWA):** «Agregar a la pantalla de inicio» la abre como una app.

## Arquitectura

```text
Navegador ──► Next.js 16 (React, TypeScript, Tailwind) ── alojado en Vercel
                 │  proxy.ts: sesión y redirecciones
                 ▼
           API REST de Supabase (HTTPS)
                 │
                 ▼
           PostgreSQL (Supabase)
             ├─ equipos, reportes
             ├─ RLS: cada cuenta solo ve y modifica lo suyo
             └─ triggers: regla de fallas, fechas y cierres
```

No hay un backend propio: la aplicación usa la API que Supabase genera, protegida por RLS. Las reglas de negocio están en la base de datos, de modo que no se pueden saltar llamando a la API desde la consola del navegador.

Flujo de un reporte (pipeline de datos):
formulario → validación en la UI → API de Supabase → RLS → trigger → tabla → consulta → panel y Excel.

## Requisitos

- Node.js 24 o superior y npm
- Una cuenta de Supabase (el plan gratuito es suficiente)

## Instalación (en otro equipo)

1. Clona el repositorio e instala las dependencias:

   ```powershell
   git clone <URL-del-repositorio>
   cd biomedmanager
   npm install
   ```

2. Crea un proyecto en Supabase. En **SQL Editor**, ejecuta en este orden:
   1. `supabase/sql/000_esquema_actual.sql`: tablas, índices, permisos y RLS.
   2. `supabase/sql/001_regla_fallas.sql`: regla de fallas.
   3. `supabase/sql/002_historial_estados.sql`: trazabilidad de estados.
   4. Opcional: `900_pruebas_regla.sql` y `901_pruebas_historial.sql`, las pruebas automáticas. Necesitan al menos una cuenta registrada; con dos cuentas también se comprueba el aislamiento entre ellas. Los resultados obtenidos están en `docs/pruebas/RESULTADOS_PRUEBAS_SQL.md`.

3. En **Authentication → URL Configuration**, configura la **Site URL** (`http://localhost:3000` en local) y agrega `http://localhost:3000/**` en **Redirect URLs**.

4. Copia `.env.example` como `.env.local` y completa la URL y la *publishable key* de tu proyecto (**Project Settings → API**).

5. Ejecuta la aplicación:

   ```powershell
   npm run dev
   ```

   Abre <http://localhost:3000>, regístrate e inicia sesión.

### Comprobaciones

```powershell
npm run lint
npm run build
npm audit --omit=dev
```

## Modelo de datos

| Tabla | Campos principales |
| --- | --- |
| `equipos` | `codigo` (único por cuenta, sin distinguir mayúsculas), `nombre`, `marca`, `modelo`, `ubicacion`, `estado` (Operativo / Con falla / Mantenimiento), `usuario_id`, `creado_en` |
| `reportes` | `equipo_id`, `tipo` (Falla / Observación), `descripcion` (5-2000 caracteres), `estado_atencion` (Pendiente / Resuelto), `nota_cierre`, `resuelto_en`, `usuario_id`, `creado_en` |
| `historial_estados` | `equipo_id`, `estado_anterior`, `estado_nuevo`, `origen` (alta / falla reportada / cambio manual), `usuario_id`, `creado_en`; solo lectura desde la API |

Los scripts de `supabase/sql/` son la fuente de verdad del esquema.

## Estructura

```text
src/
  app/                 páginas (panel, login, registro, ficha, etiqueta QR, confirmación)
  components/          componentes de interfaz reutilizables
  lib/                 tipos, indicadores, exportación a Excel, errores, cliente de Supabase
  proxy.ts             protección de rutas y renovación de la sesión
supabase/sql/          esquema, migraciones y pruebas de la base de datos
docs/                  plan técnico, casos de uso (PlantUML/SVG/PNG) y pruebas con usuarios
```

## Limitaciones conocidas

- Cada cuenta es un inventario individual: no hay inventario compartido ni roles (trabajo futuro).
- No se pueden borrar equipos ni reportes: así se conserva el historial.
- Los correos de confirmación salen por un SMTP de Gmail con contraseña de aplicación: es suficiente para pruebas, pero no para envíos masivos. Sin SMTP propio, Supabase solo envía a los miembros del equipo del proyecto.
- La plantilla «Confirm signup» de Supabase debe apuntar a `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. Así el enlace funciona aunque se abra en otro dispositivo.
- En correos institucionales, el filtro de seguridad puede abrir el enlace de confirmación antes que la persona. En ese caso basta con iniciar sesión.
