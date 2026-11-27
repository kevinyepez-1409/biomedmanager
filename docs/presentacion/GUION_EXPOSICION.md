# Guion de exposición: BioMedManager

Duración estimada: **8 a 10 minutos**, más 20 s del anuncio inicial, unos 50 segundos por diapositiva. Es una guía para decirlo con tus palabras, no para leerla.

---

## 0. Anuncio en video (20 s, se reproduce solo)

> La primera diapositiva es un anuncio de 20 segundos. Déjalo correr sin hablar y, cuando termine, pasa a la portada. Los números de abajo siguen el orden del contenido: en PowerPoint, cada diapositiva aparece un número más adelante.

## 1. Portada (20 s)

> Buenos días. Les presento **BioMedManager**, una aplicación web para gestionar el inventario de equipos biomédicos y controlar el ciclo de vida de sus fallas. La desarrollé para Programación Avanzada, desde la mirada de la ingeniería biomédica.

## 2. Business Model Canvas (1 min)

> El problema de partida es concreto: en muchas clínicas pequeñas el inventario se lleva en una hoja de cálculo o por WhatsApp, y ahí nada impide que un equipo con una falla sin resolver siga apareciendo como disponible para usarse con un paciente.
>
> Mi **propuesta de valor** es saber en todo momento qué equipo está fuera de servicio, por qué y desde cuándo, sin que ninguno con una falla abierta figure como disponible.
>
> El **segmento** inicial son clínicas pequeñas y centros de salud donde una sola persona responde por los equipos. Los hospitales públicos quedan como visión a futuro, porque compran por contratación pública.
>
> En **costos**, el MVP cuesta 0 dólares porque usa planes gratuitos. Los **ingresos**, una suscripción o una tarifa por número de equipos, los presento como hipótesis: todavía no están validados.

## 3. Tools Used to Develop the App (40 s)

> Usé **TypeScript con Next.js 16 y React 19** para la interfaz y **Tailwind CSS** para el diseño. El backend es **Supabase**: base de datos PostgreSQL, autenticación y una API REST que se genera automáticamente.
>
> La app está publicada en **Vercel** y el código en **GitHub**. Además usé dos librerías pequeñas, una para exportar a Excel y otra para generar códigos QR, y Gmail para enviar los correos de confirmación. Todas las versiones de la diapositiva son las reales del proyecto.

## 4. Software Architecture (1 min)

> La arquitectura tiene tres partes. A la izquierda, el usuario, desde el navegador, desde el celular con la app instalada o escaneando una etiqueta QR.
>
> En el centro, la aplicación Next.js publicada en Vercel. El archivo **proxy.ts** controla la sesión y protege las páginas.
>
> A la derecha, **Supabase**: el servicio de autenticación y la base de datos PostgreSQL. Lo importante es que **la seguridad no depende de la pantalla**. Las políticas RLS hacen que cada cuenta vea solo sus datos, y los **triggers** imponen la regla de salud. Aunque alguien intente saltarse la interfaz y llamar a la API directamente, la base de datos lo rechaza.
>
> Abajo está el flujo de un reporte de falla: formulario, validación, API, comprobación de RLS, trigger que marca el equipo «Con falla», tablas e historial, y de ahí al panel y al Excel.

## 5. Use of Artificial Intelligence in Development (50 s)

> Sobre el uso de IA, quiero ser transparente. Usé **Claude** para la revisión crítica del proyecto y del Canvas, y **Claude Code** como asistente que trabaja directamente sobre el repositorio: auditó la seguridad, generó gran parte del código TypeScript y SQL, ayudó a depurar errores, por ejemplo la configuración del correo, e hizo los diagramas y la documentación.
>
> Calculo que **alrededor del 70 % del código** se generó con IA. La configuración inicial del proyecto la hice yo, y cada etapa posterior la revisé, la probé y la aprobé. Un ejemplo de prompt fue pedirle que evaluara críticamente el proyecto antes de programar. De ahí salió la idea de cerrar el ciclo de cada falla, que hoy es la regla central de la app.
>
> Y la respuesta a la última pregunta: **la app no usa IA internamente**. Sus reglas son deterministas y están en la base de datos.

## 6. Use cases app (1 min)

> Este es el diagrama de casos de uso, con **solo las funcionalidades que existen y están probadas**.
>
> Hay dos actores principales. El **visitante** puede registrarse, confirmar su correo y recuperar su contraseña. El **responsable técnico** inicia sesión y gestiona el inventario: registra y edita equipos, consulta la ficha, cambia el estado, reporta fallas u observaciones y las resuelve con una nota de cierre. **Supabase Auth** aparece como sistema externo que valida credenciales y envía los correos.
>
> Dos relaciones destacan. Cambiar el estado **incluye** siempre verificar las fallas pendientes. Y reportar una falla se **extiende** marcando automáticamente el equipo «Con falla».

## 7. Health Rule & Tests (1 min 20 s)

> El curso pedía al menos una regla de validación de salud, y esta es la mía: **ningún equipo con una falla abierta puede figurar como disponible**.
>
> A la derecha está el ciclo. Reporto una falla de un monitor, que no enciende, y el equipo pasa solo a «Con falla». Si intento marcarlo como operativo, **el sistema lo bloquea** y me dice que tiene una falla pendiente. Primero hay que resolverla con una nota de lo que se hizo, por ejemplo «se cambió el fusible», y recién entonces puedo devolverlo a operativo. No vuelve solo a operativo, porque en la práctica clínica el equipo se verifica antes de devolverlo al servicio.
>
> Además, cada cambio de estado queda registrado en un historial que nadie puede editar: es la **trazabilidad**.
>
> Lo comprobé con **pruebas automáticas directamente en la base de datos**: 12 de 12 correctas para la regla y la separación entre cuentas, y 6 de 6 para la trazabilidad.

## 8. Final Product (50 s)

> Este es el producto final, publicado en **biomedmanager.vercel.app**. Aquí se ve la ficha de un equipo con su estado, sus datos y los botones de etiqueta QR y edición. Abajo, el inicio de sesión, que incluye recuperación de contraseña. A la derecha, la versión móvil.
>
> Desde el celular se puede **instalar como una app**. Si alguien escanea la etiqueta QR pegada en un equipo, después de iniciar sesión llega directamente a la ficha de ese equipo para reportar la falla desde donde está. El panel muestra indicadores como la disponibilidad y el tiempo medio de reparación, y el inventario se puede exportar a Excel.

## 9. Short Video (20 s)

> Preparé dos videos cortos. El primero muestra la app en la computadora: el panel, el reporte de una falla, el bloqueo de la regla, la resolución, los indicadores y el Excel. El segundo muestra cómo se instala en el celular y cómo se usa desde ahí.

*(Si vas a reproducirlos aquí, este es el momento: «App web pc.mp4» y luego «App mobil Celular instalacion.mp4».)*

## 10. Project on GitHub (30 s)

> El código está en GitHub y la app está publicada. El proyecto es **reproducible en otra computadora**: el README explica la instalación paso a paso, hay un archivo de ejemplo para las variables de entorno y los scripts SQL recrean la base de datos con sus reglas y sus pruebas.
>
> Para terminar, las limitaciones: es un prototipo académico, no apto para uso clínico real. Cada cuenta es un inventario individual, y los roles y el inventario compartido entre varias personas quedarían como trabajo futuro. Gracias, quedo atento a sus preguntas.

---

## Preguntas probables y respuestas cortas

- **¿Por qué no hiciste un backend propio?** Supabase ya ofrece una API protegida por RLS. Un backend propio duplicaría lógica sin añadir seguridad. Las reglas importantes están en la base de datos, donde no se pueden saltar.
- **¿Qué pasa si alguien manipula la app desde la consola del navegador?** La base de datos rechaza la operación, porque la regla está en triggers y permisos y no solo en la pantalla. Lo demostré con las pruebas automáticas.
- **¿Por qué no usa IA?** No hacía falta: la regla de salud es determinista. Añadir IA implicaría costos y una clave secreta en un servidor, sin mejorar la seguridad del paciente.
- **¿Cómo validaste el producto?** Con pruebas automáticas en la base de datos y con pruebas de usabilidad con usuarios. *(Completar con los resultados de tus 5 probadores.)*
