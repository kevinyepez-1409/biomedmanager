# Resultados de las pruebas automáticas de la regla de salud y de RLS

- **Script:** [`supabase/sql/900_pruebas_regla.sql`](../../supabase/sql/900_pruebas_regla.sql)
- **Fecha de ejecución:** 25 de noviembre de 2026
- **Entorno:** proyecto Supabase de BioMedManager (SQL Editor). Se simularon dos cuentas reales con el rol `authenticated`, igual que la API. El equipo temporal `PRUEBA-900` se borró al final.

| # | Caso | Resultado |
| --- | --- | --- |
| 1 | Observación: el equipo sigue Operativo | OK |
| 2 | Falla: el equipo pasa a Con falla | OK |
| 3 | Falla pendiente: Operativo bloqueado (llamada directa a la base de datos) | OK |
| 5 | Falla pendiente: Mantenimiento permitido | OK |
| 6 | Resolver sin nota: rechazado | OK |
| 7 | Resolver con nota y volver a Operativo | OK |
| 8 | Reporte resuelto: no modificable | OK |
| 9 | Reporte nuevo siempre Pendiente | OK |
| 10 | Cambiar `creado_en`: sin permiso | OK |
| 11 | La cuenta B no ve el equipo de la cuenta A | OK |
| 12 | La cuenta B no modifica el equipo de la cuenta A | OK |
| 13 | La cuenta B no reporta sobre un equipo de la cuenta A | OK |

**12/12 OK.** El caso 4 del plan técnico, el bloqueo mediante una llamada directa a la API, queda cubierto por el caso 3: la prueba actúa con el mismo rol y las mismas credenciales que usa la API, así que el trigger lo rechaza igual.

Primer intento: el script falló por un error de tipos del propio script (corregido en el commit `e8bfe19`). Como el bloque es transaccional, no dejó datos.
