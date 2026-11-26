# Guion del video de BioMedManager (grabado con Zoom, unos 3 minutos)

Formato: compartes la pantalla en Zoom y vas conversando mientras usas la app.
Si te acompaña otra persona, puede hacer las preguntas marcadas con **🙋**. Si grabas solo, dilas tú como transición («Ahora, ¿qué pasa si…?»).

---

## 1. Antes de grabar (10 minutos de preparación)

**En la app (https://biomedmanager.vercel.app), con tu cuenta ya iniciada:**

- Ten de 4 a 6 equipos cargados para que el panel y los gráficos se vean con datos. Por ejemplo:
  - BM-001 Monitor multiparámetro (Philips, UCI cama 3), Operativo.
  - BM-002 Bomba de infusión, Operativo.
  - BM-003 Ventilador mecánico, Mantenimiento.
  - BM-004 Desfibrilador, Operativo. **Este es el que usarás en la demostración.**
- Deja BM-004 **sin fallas pendientes**, para reportarle una falla en vivo.
- Abre la etiqueta QR de BM-004 («Etiqueta QR») en otra pestaña, o imprímela.
- Cierra las demás pestañas y silencia las notificaciones de Windows (Inicio → Configuración → Sistema → Notificaciones → No molestar).
- Sube el zoom del navegador a 110–125 % (Ctrl + «+») para que se lea bien en el video.

**En Zoom (aplicación de escritorio):**

1. Abre Zoom → ⚙️ **Configuración** → **Grabación** → revisa la carpeta donde se guardan los videos (normalmente `Documentos\Zoom`).
2. En **Configuración → Video**, activa tu cámara si quieres salir en un recuadro pequeño (recomendado: da cercanía).
3. Pulsa **Nueva reunión**. Estarás solo (o con tu acompañante).
4. **Compartir pantalla** → elige la **ventana de Chrome** con la app (no la pantalla completa, así no se ven otras cosas).
5. Para la parte del QR, une tu celular a la misma reunión (app Zoom) **con el micrófono y el altavoz silenciados** (evita el eco) y, cuando llegue ese momento, comparte la pantalla del celular.
6. Pulsa **Grabar → Grabar en este equipo**. Cuenta 3 segundos en silencio y empieza.

---

## 2. Guion con tiempos

| Tiempo | Qué muestras | Qué dices (idea, no hay que leerlo palabra por palabra) |
| --- | --- | --- |
| **0:00–0:20** | Tu cámara o la pantalla de inicio de sesión | «Hola, soy Kevin Yépez. En muchas clínicas el inventario de equipos médicos se lleva en Excel o por WhatsApp, y un equipo con una falla puede seguir figurando como disponible. BioMedManager resuelve eso.» |
| **0:20–0:45** | Inicias sesión → **Panel de equipos** | «Entro con mi cuenta. Cada usuario solo ve su propio inventario. Arriba están los indicadores: disponibilidad, fallas pendientes, equipos fuera de servicio y el tiempo medio de reparación. Abajo, los gráficos del estado del inventario.» |
| **0:45–1:00** | Buscador y filtro por estado; **Agregar equipo** (abre y cierra el formulario, o registra uno rápido) | «Puedo buscar por código, nombre o marca, filtrar por estado y dar de alta un equipo nuevo.» |
| **1:00–1:25** | **Ver ficha** de BM-004 → **Nuevo reporte** → Tipo **Falla** → Descripción «La pantalla no enciende al conectar la alimentación.» → guardar | 🙋 «¿Qué pasa si el desfibrilador se daña?» — «Reporto la falla desde su ficha. Fíjate: el equipo pasa solo a **Con falla**, sin que nadie tenga que cambiarlo a mano.» |
| **1:25–1:50** | En **Estado del equipo**, haz clic en **Marcar operativo**: aparece el aviso «No se puede marcar como Operativo: el equipo tiene 1 falla pendiente…» | 🙋 «¿Y si alguien lo marca como operativo igual?» — «No puede. Esta es la regla central: **un equipo con una falla abierta no puede figurar como disponible**. Y no es solo un botón desactivado: la regla está en la base de datos, así que se cumple aunque alguien intente saltarse la pantalla. La probé con 18 pruebas automáticas.» |
| **1:50–2:10** | En **Historial de reportes**, **Resolver** → **Nota de cierre** «Se reemplazó el cable de alimentación.» → **Confirmar resolución** → **Marcar operativo** | «Cuando el técnico la repara, cierro la falla con una nota obligatoria. Ahora sí puedo marcarlo operativo.» |
| **2:10–2:25** | Baja a **Trazabilidad de estados** | «Cada cambio de estado queda registrado con fecha y origen, y nadie lo puede editar. Sirve para auditorías.» |
| **2:25–2:40** | **Volver al panel** → **Exportar a Excel** → abre el archivo un segundo | «Con un clic exporto el inventario a Excel: resumen, equipos, reportes y cambios de estado.» |
| **2:40–2:55** | Pantalla del celular: escanea la **Etiqueta QR** → se abre la ficha del equipo | «Cada equipo tiene su etiqueta QR. La pego en el equipo, la escaneo con el celular y llego directo a su ficha para reportar la falla donde ocurre.» |
| **2:55–3:05** | Vuelve a tu cámara o al panel | «BioMedManager está hecho con Next.js y Supabase, publicado en Vercel. Es un MVP: todavía no maneja varias personas por institución. Gracias.» |

---

## 3. Consejos para que salga bien

- **Ensaya una vez sin grabar.** Sirve para medir el tiempo y dejar los datos listos.
- Habla **más lento** de lo normal y **mueve el mouse despacio**. Señala con el cursor lo que estás nombrando.
- Si te equivocas, **no pares**: haz una pausa de 3 segundos y repite la frase. Luego se corta.
- Si el video pasa de 3 minutos, acorta los tramos 0:45–1:00 (buscador) y 2:10–2:25 (trazabilidad).
- Después de ensayar, **vuelve a dejar BM-004 sin fallas pendientes** (resolviendo la falla) antes de la grabación real. La falla resuelta del ensayo puede quedarse: aporta datos al MTTR.

## 4. Después de grabar

1. Pulsa **Detener grabación** y luego **Finalizar reunión**.
2. Zoom convierte el video al cerrar; espera a que termine. Se abre la carpeta con un archivo **.mp4**.
3. Para recortar el inicio o el final: ábrelo con **Clipchamp** (viene en Windows 11) → recorta → **Exportar a 1080p**.
4. Súbelo a YouTube como **No listado** (o a OneDrive) y pásame el enlace para ponerlo en la diapositiva del video.
