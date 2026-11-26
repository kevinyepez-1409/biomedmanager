# Construye la presentacion de BioMedManager sobre la plantilla del curso.
# Uso: python construir_presentacion.py <plantilla.pptx> <salida.pptx> <carpeta_capturas> <raiz_repo>
# Requiere: python-pptx, Pillow.
import copy
import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

PLANTILLA, SALIDA, IMG, REPO = map(Path, sys.argv[1:5])

TEAL = RGBColor(0x15, 0x6D, 0x74)
TEAL_CLARO = RGBColor(0xEC, 0xF8, 0xF8)
ROJO = RGBColor(0xB9, 0x1C, 0x1C)
ROJO_CLARO = RGBColor(0xFE, 0xF2, 0xF2)
VERDE = RGBColor(0x04, 0x78, 0x57)
VERDE_CLARO = RGBColor(0xEC, 0xFD, 0xF5)
TINTA = RGBColor(0x0F, 0x17, 0x2A)
GRIS = RGBColor(0x47, 0x55, 0x69)
BORDE = RGBColor(0xCB, 0xD5, 0xE1)

prs = Presentation(PLANTILLA)
SW, SH = prs.slide_width, prs.slide_height


def lang_es(run):
    run._r.get_or_add_rPr().set("lang", "es-EC")


def rellenar(tf, items, tamano=None):
    """items: lista de dicts {vineta: bool, segs: [(texto, negrita, cursiva, enlace)]}.
    Clona los parrafos de la plantilla (subtitulo sin vineta / con vineta)."""
    pars = tf._txBody.findall(qn("a:p"))
    base_plano = copy.deepcopy(pars[0])
    base_vineta = copy.deepcopy(pars[1] if len(pars) > 1 else pars[0])
    for p in pars:
        tf._txBody.remove(p)
    for it in items:
        p = copy.deepcopy(base_vineta if it.get("vineta", True) else base_plano)
        for r in p.findall(qn("a:r")):
            p.remove(r)
        if not it.get("vineta", True):
            ppr = p.find(qn("a:pPr"))
            if ppr is None:
                ppr = p.makeelement(qn("a:pPr"), {})
                p.insert(0, ppr)
            for tag in ("a:buFont", "a:buChar", "a:buAutoNum", "a:buNone"):
                for e in ppr.findall(qn(tag)):
                    ppr.remove(e)
            ppr.set("marL", "0")
            ppr.set("indent", "0")
            ppr.append(ppr.makeelement(qn("a:buNone"), {}))
        tf._txBody.append(p)
        par = tf.paragraphs[-1]
        if it.get("espacio"):
            par.space_before = Pt(it["espacio"])
        for texto, negrita, cursiva, *resto in it["segs"]:
            run = par.add_run()
            run.text = texto
            run.font.bold = negrita
            run.font.italic = cursiva
            if tamano:
                run.font.size = Pt(tamano)
            if resto and resto[0]:
                run.hyperlink.address = resto[0]
            lang_es(run)


def v(etiqueta, texto="", enlace=None):
    segs = []
    if etiqueta:
        segs.append((etiqueta, True, None))
    if texto:
        segs.append((texto, None, None, enlace))
    return {"vineta": True, "segs": segs}


def subtitulo(texto):
    return {"vineta": False, "segs": [(texto, None, True)]}


def caja(slide, x, y, w, h, texto, relleno, borde, color=TINTA, tamano=13, negrita=False, alinear=PP_ALIGN.CENTER):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    s.adjustments[0] = 0.18
    s.fill.solid()
    s.fill.fore_color.rgb = relleno
    s.line.color.rgb = borde
    s.line.width = Pt(1.25)
    s.shadow.inherit = False
    tf = s.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    for m in ("margin_left", "margin_right"):
        setattr(tf, m, Inches(0.1))
    tf.margin_top = tf.margin_bottom = Inches(0.04)
    lineas = texto if isinstance(texto, list) else [texto]
    for i, linea in enumerate(lineas):
        par = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        par.alignment = alinear
        if isinstance(linea, tuple):
            contenido, n, t, c = linea
        else:
            contenido, n, t, c = linea, negrita, tamano, color
        run = par.add_run()
        run.text = contenido
        run.font.size = Pt(t)
        run.font.bold = n
        run.font.color.rgb = c
        lang_es(run)
    return s


def texto_libre(slide, x, y, w, h, parrafos, alinear=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, (contenido, tam, negrita, color) in enumerate(parrafos):
        par = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        par.alignment = alinear
        run = par.add_run()
        run.text = contenido
        run.font.size = Pt(tam)
        run.font.bold = negrita
        run.font.color.rgb = color
        lang_es(run)
    return tb


def imagen(slide, ruta, x, y, w=None, h=None, borde=True):
    pic = slide.shapes.add_picture(str(ruta), x, y, w, h)
    if borde:
        pic.line.color.rgb = BORDE
        pic.line.width = Pt(0.75)
    return pic


def flecha_abajo(slide, x, y):
    a = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, x, y, Inches(0.26), Inches(0.2))
    a.fill.solid()
    a.fill.fore_color.rgb = GRIS
    a.line.fill.background()
    a.shadow.inherit = False


def notas(slide, texto):
    slide.notes_slide.notes_text_frame.text = texto


def nueva_diapositiva(titulo, despues_de, modelo):
    """Crea una diapositiva con el layout 'Titulo y objetos' y la mueve."""
    layout = modelo.slide_layout
    s = prs.slides.add_slide(layout)
    s.shapes.title.text = titulo
    for r in s.shapes.title.text_frame.paragraphs[0].runs:
        lang_es(r)
    # Fecha y numero de diapositiva igual que en las demas.
    for sp in modelo.shapes:
        if sp.is_placeholder and sp.placeholder_format.idx in (10, 12):
            s.shapes._spTree.append(copy.deepcopy(sp._element))
    lista = prs.slides._sldIdLst
    elem = lista[-1]
    lista.remove(elem)
    lista.insert(list(prs.slides).index(despues_de) + 1, elem)
    return s


def quitar(shape):
    shape._element.getparent().remove(shape._element)


slides = list(prs.slides)
portada, canvas, herramientas, ia, casos, producto, video, github = slides

# ---------------------------------------------------------------- 1 Portada
for sh in portada.slide_layout.shapes:
    if sh.has_text_frame:
        for par in sh.text_frame.paragraphs:
            for r in par.runs:
                if "Project Name" in r.text:
                    r.text = "BioMedManager"
texto_libre(
    portada, Inches(1.99), Inches(4.58), Inches(9.72), Inches(0.9),
    [
        ("Inventario de equipos biomédicos con control del ciclo de cada falla", 18, False, GRIS),
        ("Kevin Yépez · Programación Avanzada · Ingeniería Biomédica", 14, True, TINTA),
    ],
    alinear=PP_ALIGN.CENTER,
)
notas(portada, "BioMedManager: aplicación web para que el responsable de equipos biomédicos sepa qué está fuera de servicio, por qué y desde cuándo. App publicada en biomedmanager.vercel.app.")

# ---------------------------------------------------------------- 2 Canvas
STICKIES = {
    877: "Supabase y Vercel (infraestructura)",
    923: "Docentes y técnicos de prácticas",
    889: "Desarrollo y mejora de la app",
    947: "Pruebas con\nusuarios",
    968: "Soporte y capacitación",
    953: "Código en GitHub",
    901: "BD con reglas de salud",
    965: "Conocimiento en ingeniería clínica",
    883: "Qué equipo está fuera de servicio, por qué y desde cuándo",
    941: "Ningún equipo con falla figura como disponible",
    959: "Historial y trazabilidad de cada equipo",
    962: "Excel e indicadores (MTTR) en un clic",
    917: "Autoservicio web, capacitación inicial y soporte",
    880: "App web instalable (PWA), demos y etiquetas QR",
    938: "Clínicas pequeñas y centros de salud\nsin sistema de gestión",
    971: "Responsables y técnicos biomédicos",
    932: "MVP: $0 (planes gratuitos)",
    956: "A futuro: planes de pago y soporte",
    892: "Hipótesis: suscripción mensual",
    974: "Hipótesis: tarifa según n.º de equipos",
}
for sh in canvas.shapes:
    if sh.shape_id == 902:
        par = sh.text_frame.paragraphs[0]
        run = par.add_run()
        run.text = " BioMedManager"
        run.font.bold = True
        lang_es(run)
    if sh.shape_id in STICKIES:
        nota = list(sh.shapes)[1]
        tf = nota.text_frame
        tf.clear()
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_right = Inches(0.05)
        tf.margin_top = tf.margin_bottom = Inches(0.02)
        for k, linea in enumerate(STICKIES[sh.shape_id].split("\n")):
            par = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
            par.alignment = PP_ALIGN.CENTER
            run = par.add_run()
            run.text = linea
            run.font.size = Pt(7.5)
            run.font.bold = True
            run.font.color.rgb = TINTA
            lang_es(run)
notas(canvas, "Segmento inicial acotado: clínicas pequeñas donde una persona responde por los equipos. Competencia real: hojas de cálculo y WhatsApp. Ingresos y segmentos son hipótesis sin validar; las 5 pruebas validan usabilidad, no mercado.")

# ---------------------------------------------------------------- 3 Herramientas
rellenar(
    herramientas.placeholders[1].text_frame,
    [
        subtitulo("Herramientas y versiones utilizadas (verificadas en el proyecto)"),
        v("Lenguaje y framework:", " TypeScript 5.9 · Next.js 16.4.6 (App Router) · React 19.3"),
        v("Editor (IDE):", " Visual Studio Code · Claude Code (asistente en terminal)"),
        v("Base de datos / backend:", " Supabase: PostgreSQL con RLS y triggers, Auth y API REST (supabase-js 2.118, @supabase/ssr 0.12.7)"),
        v("Diseño de interfaz:", " Tailwind CSS 4.3, componentes propios (sin librerías de UI)"),
        v("Despliegue / hosting:", " Vercel (plan Hobby) + GitHub; app instalable en el celular (PWA)"),
        v("Otras librerías y servicios:", " write-excel-file 4.1.1 (Excel) · qrcode 1.5.4 (etiquetas QR) · Gmail SMTP (correos) · Node.js 24.22 · Git 2.51"),
    ],
    tamano=17,
)
notas(herramientas, "Todas las versiones salen de package.json y del entorno real. No hay backend propio: la API la genera Supabase.")

# ---------------------------------------------------------------- 3b Arquitectura
arq = nueva_diapositiva("Software Architecture", herramientas, herramientas)
for ph in list(arq.placeholders):
    if ph.placeholder_format.idx == 1:
        quitar(ph)
ancho = Inches(11.7)
imagen(arq, REPO / "docs/arquitectura/arquitectura.png", int((SW - ancho) / 2), Inches(1.3), w=ancho, borde=False)
notas(arq, "El navegador habla con la API de Supabase. La seguridad no depende de la pantalla: RLS limita cada cuenta a sus datos y los triggers imponen la regla de salud y registran la trazabilidad. GitHub publica automáticamente en Vercel.")

# ---------------------------------------------------------------- 4 IA
rellenar(
    ia.placeholders[1].text_frame,
    [
        subtitulo("Herramientas de IA usadas y para qué"),
        v("Herramientas:", " Claude (chat) y Claude Code (agente que trabaja sobre el repositorio)."),
        v("Usos:", " revisión crítica del proyecto y del Canvas, auditoría de seguridad (RLS), código TypeScript y SQL, depuración (correo SMTP, compilación), diagramas UML y documentación."),
        v("Porcentaje aproximado de código generado con IA:", " alrededor del 70 %, revisado, probado y aprobado por el autor en cada etapa."),
        v("Ejemplo:", " «Evalúa críticamente el proyecto y propón rutas A/B/C; no escribas código todavía». Resultado: el diagnóstico y la ruta «ciclo de falla cerrado», que hoy es la regla de salud de la app."),
        v("¿La app usa IA internamente?", " No. No llama a ninguna API de IA; sus reglas son deterministas y viven en PostgreSQL."),
    ],
    tamano=17,
)
notas(ia, "Declaración honesta del uso de IA. Confirmar el porcentaje antes de presentar.")

# ---------------------------------------------------------------- 5 Casos de uso
for sh in list(casos.shapes):
    if sh.shape_type == 13:  # imagen de ejemplo
        quitar(sh)
cuerpo = casos.placeholders[1]
cuerpo.left, cuerpo.top, cuerpo.width, cuerpo.height = Inches(0.92), Inches(1.45), Inches(5.3), Inches(5.3)
rellenar(
    cuerpo.text_frame,
    [
        subtitulo("Solo funcionalidades implementadas y verificadas"),
        v("Visitante:", " se registra, confirma su correo y recupera la contraseña."),
        v("Responsable técnico:", " gestiona el inventario, la ficha de cada equipo y sus reportes."),
        v("Supabase Auth:", " sistema externo que valida credenciales y envía los correos."),
        v("«include»:", " cambiar el estado siempre verifica fallas pendientes."),
        v("«extend»:", " una Falla marca el equipo «Con falla»."),
    ],
    tamano=14,
)
alto = Inches(5.6)
pic = imagen(casos, REPO / "docs/uml/casos_de_uso.png", 0, Inches(1.28), h=alto)
pic.left = SW - pic.width - Inches(0.45)
notas(casos, "Diagrama completo en docs/uml/casos_de_uso.puml (editable) y .png. Recorrer: registro, inventario, ficha y el ciclo de una falla.")

# ---------------------------------------------------------------- 5b Regla de salud y pruebas
regla = nueva_diapositiva("Health Rule & Tests", casos, herramientas)
cuerpo = regla.placeholders[1]
cuerpo.left, cuerpo.top, cuerpo.width, cuerpo.height = Inches(0.92), Inches(1.4), Inches(6.3), Inches(5.4)
rellenar(
    cuerpo.text_frame,
    [
        subtitulo("Ningún equipo con una falla abierta figura como disponible"),
        v("Regla 1:", " reportar una Falla pasa el equipo a «Con falla»."),
        v("Regla 2:", " no puede volver a «Operativo» con fallas pendientes (sí a «Mantenimiento»)."),
        v("Regla 3:", " resolver exige nota de cierre; la fecha la pone la base de datos."),
        v("Dónde se impone:", " triggers y permisos de PostgreSQL. Ni una llamada directa a la API puede saltarla."),
        v("Trazabilidad:", " cada cambio de estado queda registrado y no se puede editar."),
    ],
    tamano=16,
)
x0, w0, h0 = Inches(7.75), Inches(4.9), Inches(0.62)
pasos = [
    ("1. Reportar Falla «No enciende»", TEAL_CLARO, TEAL),
    ("2. El equipo pasa a «Con falla»", ROJO_CLARO, ROJO),
    ("3. «Marcar operativo» → BLOQUEADO: 1 falla pendiente", ROJO_CLARO, ROJO),
    ("4. Resolver con nota de cierre", TEAL_CLARO, TEAL),
    ("5. «Marcar operativo» → permitido ✓", VERDE_CLARO, VERDE),
]
y = Inches(1.45)
for i, (t, relleno, color) in enumerate(pasos):
    caja(regla, x0, y, w0, h0, t, relleno, color, color=color, tamano=13, negrita=True)
    y += h0
    if i < len(pasos) - 1:
        flecha_abajo(regla, x0 + int(w0 / 2) - Inches(0.13), y + Inches(0.02))
        y += Inches(0.24)
caja(
    regla, x0, y + Inches(0.2), w0, Inches(0.95),
    [
        ("Pruebas automáticas en la base de datos", True, 13, TINTA),
        ("12/12 OK regla de salud y aislamiento entre cuentas", False, 12, VERDE),
        ("6/6 OK trazabilidad de estados", False, 12, VERDE),
    ],
    RGBColor(0xF8, 0xFA, 0xFC), BORDE,
)
notas(regla, "Validación de salud pedida por el curso. Scripts: supabase/sql/900 y 901; resultados en docs/pruebas/RESULTADOS_PRUEBAS_SQL.md.")

# ---------------------------------------------------------------- 6 Producto final
quitar(producto.placeholders[1])
ficha = imagen(producto, IMG / "ficha.png", Inches(0.55), Inches(1.3), w=Inches(7.9))
login = imagen(producto, IMG / "login.png", Inches(0.55), ficha.top + ficha.height + Inches(0.15), w=Inches(2.9))
movil = imagen(producto, IMG / "registro_movil.png", 0, Inches(1.3), h=Inches(5.55))
movil.left = ficha.left + ficha.width + Inches(0.45)
tb = texto_libre(
    producto, Inches(3.6), login.top - Inches(0.05), Inches(4.85), Inches(1.8),
    [
        ("Ficha del equipo: estado, reportes, trazabilidad, edición y etiqueta QR.", 12, False, TINTA),
        ("Acceso: registro con confirmación por correo y recuperación de contraseña.", 12, False, TINTA),
        ("Derecha: versión móvil, instalable como app (PWA).", 12, False, TINTA),
        ("biomedmanager.vercel.app", 14, True, TEAL),
    ],
)
for par in tb.text_frame.paragraphs:
    par.space_after = Pt(4)
notas(producto, "Capturas reales de la app publicada. Ideal agregar una captura del panel con indicadores y gráficos.")

# ---------------------------------------------------------------- 7 Video
rellenar(
    video.placeholders[1].text_frame,
    [
        subtitulo("Video demostrativo (máx. 3 min): el enlace se agrega al publicarlo"),
        v("0:00 – 0:20", "  El problema: en una hoja de cálculo un equipo con falla puede figurar como disponible."),
        v("0:20 – 0:50", "  Registro, inicio de sesión y panel con indicadores."),
        v("0:50 – 1:40", "  Reportar una falla, intento bloqueado de «Operativo», resolución con nota."),
        v("1:40 – 2:10", "  Historial, trazabilidad, indicadores (MTTR) y exportación a Excel."),
        v("2:10 – 2:40", "  Etiqueta QR: escanear con el celular y abrir la ficha."),
        v("2:40 – 3:00", "  Arquitectura en una frase y limitaciones honestas."),
    ],
    tamano=17,
)
notas(video, "Guion sugerido; el video lo graba el autor.")

# ---------------------------------------------------------------- 8 GitHub
tf = github.placeholders[1].text_frame
pars = tf.paragraphs


def reemplazar(par, segmentos):
    for r in list(par.runs):
        par._p.remove(r._r)
    for texto, negrita, cursiva, *resto in segmentos:
        run = par.add_run()
        run.text = texto
        run.font.bold = negrita
        run.font.italic = cursiva
        if resto and resto[0]:
            run.hyperlink.address = resto[0]
        lang_es(run)


REPO_URL = "https://github.com/kevinyepez-1409/biomedmanager"
APP_URL = "https://biomedmanager.vercel.app"
reemplazar(pars[0], [("Entregables", True, None)])
reemplazar(pars[1], [("Repositorio: ", True, None), ("github.com/kevinyepez-1409/biomedmanager", None, None, REPO_URL)])
reemplazar(pars[2], [("App publicada: ", True, None), ("biomedmanager.vercel.app", None, None, APP_URL)])
reemplazar(pars[3], [("Código fuente: ", True, None), ("TypeScript / Next.js y scripts SQL (supabase/sql)", None, None)])
reemplazar(pars[4], [("Presentación (*.pptx) y video (máx. 3 min)", None, None)])
reemplazar(pars[7], [("Reproducible en otro equipo: ", None, True), ("README con instalación paso a paso, .env.example y scripts SQL 000–002.", None, True)])
notas(github, "Subir a la carpeta de OneDrive del curso un .zip con nombre y apellido: código, .pptx y video.")

# ---------------------------------------------------------------- Comunes
for s in prs.slides:
    for sh in s.placeholders:
        if sh.placeholder_format.idx == 10 and sh.has_text_frame:
            for par in sh.text_frame.paragraphs:
                for r in par.runs:
                    r.text = r.text.replace("2022", "2026")

SALIDA.parent.mkdir(parents=True, exist_ok=True)
prs.save(SALIDA)
print("Guardado:", SALIDA, "diapositivas:", len(prs.slides))
