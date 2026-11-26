# Scripts SQL de BioMedManager

La base de datos vive en Supabase (PostgreSQL). Estos archivos versionan su
esquema en Git. Se ejecutan **a mano** en Supabase → SQL Editor, en orden
numérico, y solo cuando se acuerde cada cambio.

| Archivo | Qué es | ¿Ejecutar en la BD actual? |
| --- | --- | --- |
| `000_esquema_actual.sql` | Esquema existente (tablas, índices, permisos, RLS) | **No**: solo para recrear el proyecto desde cero |
| `001_regla_fallas.sql` | Regla de salud: triggers de fallas y estados, permisos por columna | Sí, una vez (aplicado el 2026-11-25) |
| `002_historial_estados.sql` | Trazabilidad de cambios de estado | Sí, una vez (aplicado el 2026-11-25) |
| `900_pruebas_regla.sql`, `901_pruebas_historial.sql` | Pruebas automáticas; no dejan datos | Sí, cuando se quiera verificar |
| `consultas/inspeccion_esquema.sql` | Consulta de solo lectura para revisar el esquema real | Sí, cuando haga falta verificar |

Los cambios futuros se añadirán como `003_...sql`, `004_...sql`, etc., cada
uno con su script de pruebas.

**Nunca** guardar aquí contraseñas, claves `service_role` ni datos reales.
