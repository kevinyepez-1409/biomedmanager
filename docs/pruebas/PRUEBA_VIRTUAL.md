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

## 2. Formulario (Google Forms): solo preguntas de selección

**Título:** Prueba de BioMedManager
**Descripción:** Gracias por probar la app. No se evalúa a la persona, se evalúa la aplicación.

| # | Pregunta | Tipo en Google Forms | Opciones |
|---|---|---|---|
| 1 | ¿Desde qué dispositivo probaste la app? | Opción múltiple | Computadora · Celular · Ambos |
| 2 | ¿Qué estudias o a qué te dedicas? | Opción múltiple | Ingeniería Biomédica · Otra ingeniería · Ciencias de la salud · Otra |
| 3 | ¿Has trabajado o hecho prácticas con equipos médicos? | Opción múltiple | Sí · No |
| 4 | ¿Pudiste hacer cada tarea? | Cuadrícula de varias opciones | Filas: Crear cuenta y entrar · Registrar el monitor MON-01 · Registrar un segundo equipo · Reportar la falla · Intentar marcarlo Operativo · Resolver la falla y dejarlo Operativo · Descargar el Excel · Usar la etiqueta QR. Columnas: Lo logré fácil · Lo logré, pero me costó · No pude · No lo intenté |
| 5 | ¿Entendiste por qué la app no te dejó marcar el equipo como Operativo? | Opción múltiple | Sí · Más o menos · No |
| 6 | ¿Te parece útil esa regla? | Opción múltiple | Sí · No · No estoy seguro |
| 7 | ¿Qué fue lo más difícil? (puedes marcar varias) | Casillas de verificación | Registrarme o confirmar el correo · Registrar un equipo · Reportar la falla · Resolver la falla · Cambiar el estado del equipo · Descargar el Excel · Usar la etiqueta QR · Nada, todo fue fácil |
| 8 | ¿Qué tan fácil fue usar la app? | Escala lineal 1–5 | 1 = muy difícil · 5 = muy fácil |
| 9 | ¿Recomendarías BioMedManager a quien gestiona equipos médicos? | Opción múltiple | Sí · Tal vez · No |
| 10 | Comentario (opcional) | Respuesta corta, no obligatoria | — |

Las preguntas 1 a 9 se marcan como **obligatorias**.

**Truco:** para crear varias opciones de una vez, copia la lista de opciones (una por línea) y pégala en el campo «Opción 1». Google Forms crea una opción por cada línea.

## 3. Después de cada ronda

1. Descarga las respuestas: en Google Forms, **Respuestas → Vincular con Hojas de cálculo** o **Descargar (.csv)**; en Microsoft Forms, **Abrir en Excel**.
2. Envía el archivo para revisar las respuestas y corregir lo que haga falta. Cada cambio queda en la tabla «observación → cambio → commit» de `GUIA_PRUEBAS_USUARIOS.md`.
3. Después de los cambios de la ronda 1, envía el mismo mensaje a las 3 personas de la ronda 2.

**Evidencia para el profesor:** el archivo de respuestas, la tabla de cambios y una diapositiva con el resumen de resultados. No se inventan participantes ni respuestas: si alguien no responde, se informa así.
