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

---

## Historial de estados (trazabilidad)

- **Script:** [`supabase/sql/901_pruebas_historial.sql`](../../supabase/sql/901_pruebas_historial.sql), que prueba la migración `002_historial_estados.sql`.
- **Fecha de ejecución:** 25 de noviembre de 2026. Se usó un equipo temporal `PRUEBA-901`, borrado al final.

| # | Caso | Resultado |
| --- | --- | --- |
| 1 | El alta del equipo queda registrada en el historial | OK |
| 2 | Una falla registra el cambio con origen «Falla reportada» | OK |
| 3 | Un cambio desde la ficha queda como «Cambio manual» | OK |
| 4 | Editar otros datos no agrega entradas | OK |
| 5 | Insertar en el historial a mano: sin permiso | OK |
| 6 | La cuenta B no ve el historial de la cuenta A | OK |

**6/6 OK.**
