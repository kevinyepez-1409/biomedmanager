# Prueba virtual con 5 usuarios

La versión a distancia de la prueba: cada persona recibe un mensaje, usa la app sola desde su celular o computadora y responde un formulario corto, en unos **10 minutos**.

**Rondas:** se envía primero a **2 personas**; con sus respuestas se corrige lo necesario y luego se envía a **3 personas** más. Así se cumple «probado por 5 usuarios y documentar qué se cambió».

---

## 1. Mensaje para enviar (WhatsApp o correo)

> ¡Hola! Estoy terminando mi proyecto de Programación Avanzada: **BioMedManager**, una app para gestionar equipos biomédicos. ¿Me ayudas a probarla? Son unos 10 minutos. 🙏
>
> **App:** https://biomedmanager.vercel.app
>
> Imagina que eres el responsable de los equipos de una clínica pequeña y haz esto **sin ayuda** (usa datos inventados):
>
> 1. Crea una cuenta con tu correo, confírmala desde el enlace del mensaje que te llega y entra. Si el enlace falla, inicia sesión directamente.
> 2. Registra un **monitor multiparámetro**, código **MON-01**, ubicado en **UCI**.
> 3. Registra un segundo equipo cualquiera.
> 4. Reporta que el monitor MON-01 **no enciende**.
> 5. Intenta marcar el monitor como **Operativo**.
> 6. El técnico **cambió el fusible**: resuelve la falla y deja el equipo Operativo.
> 7. Descarga el inventario en **Excel** y ábrelo.
> 8. (Opcional, con el celular) Abre la **Etiqueta QR** del monitor y escanéala.
>
> Al terminar, responde este formulario (2 minutos): **[ENLACE DEL FORMULARIO]**
>
> No pasa nada si algo no te sale: justamente busco lo que hay que mejorar. ¡Gracias!

---

## 2. Formulario (Google Forms o Microsoft Forms)

**Título:** Prueba de BioMedManager
**Descripción:** Gracias por probar la app. No se evalúa a la persona, se evalúa la aplicación.

| # | Pregunta | Tipo | Opciones |
|---|---|---|---|
| 1 | Tu nombre o iniciales | Respuesta corta | — |
| 2 | ¿Desde qué dispositivo la probaste? | Opción múltiple | Computadora · Celular |
| 3 | ¿Tienes experiencia con equipos biomédicos o hiciste prácticas en un hospital? | Opción múltiple | Sí · No |
| 4 | ¿Pudiste hacer cada tarea? | **Cuadrícula de opción múltiple** | Filas: 1 Crear cuenta y entrar · 2 Registrar MON-01 · 3 Segundo equipo · 4 Reportar la falla · 5 Intentar marcar Operativo · 6 Resolver la falla y dejarlo Operativo · 7 Descargar Excel · 8 Etiqueta QR. Columnas: Sí, sin problema · Sí, pero me costó · No pude · No lo intenté |
| 5 | En la tarea 5, la app no te dejó marcar el equipo como Operativo. ¿Entendiste por qué? | Opción múltiple | Sí, entendí · Más o menos · No entendí |
| 6 | ¿Te parece útil esa regla (no permitir «Operativo» con una falla pendiente)? | Opción múltiple | Sí · No · No estoy seguro |
| 7 | ¿Qué fue lo más confuso o difícil? | Párrafo | — |
| 8 | Del 1 al 5, ¿qué tan fácil fue usar la app? | Escala lineal 1–5 | 1 = muy difícil · 5 = muy fácil |
| 9 | Solo si tienes experiencia: ¿cómo se lleva el inventario de equipos donde trabajaste o hiciste prácticas? | Párrafo (opcional) | — |
| 10 | ¿Algo que agregarías o cambiarías? | Párrafo (opcional) | — |

---

## 3. Después de cada ronda

1. Descarga las respuestas: en Google Forms, **Respuestas → Vincular con Hojas de cálculo** o **Descargar (.csv)**; en Microsoft Forms, **Abrir en Excel**.
2. Envía el archivo para revisar las respuestas y corregir lo que haga falta. Cada cambio queda en la tabla «observación → cambio → commit» de `GUIA_PRUEBAS_USUARIOS.md`.
3. Después de los cambios de la ronda 1, envía el mismo mensaje a las 3 personas de la ronda 2.

**Evidencia para el profesor:** el archivo de respuestas, la tabla de cambios y una diapositiva con el resumen de resultados. No se inventan participantes ni respuestas: si alguien no responde, se informa así.
