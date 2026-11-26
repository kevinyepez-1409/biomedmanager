# Escenas del anuncio de 20 s de BioMedManager (16:9). Las animaciones y
# tiempos se aplican despues con PowerPoint (animar.ps1).
import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

SALIDA, RECURSOS, CAPTURAS = map(Path, sys.argv[1:4])

OSCURO = RGBColor(0x0C, 0x3A, 0x40)
TEAL = RGBColor(0x15, 0x6D, 0x74)
TEAL_CLARO = RGBColor(0xA3, 0xDC, 0xDD)
BLANCO = RGBColor(0xFF, 0xFF, 0xFF)
FONDO = RGBColor(0xF8, 0xFA, 0xFC)
TINTA = RGBColor(0x0F, 0x17, 0x2A)
GRIS = RGBColor(0x47, 0x55, 0x69)
ROJO = RGBColor(0xDC, 0x26, 0x26)
ROJO_SUAVE = RGBColor(0xFE, 0xE2, 0xE2)
VERDE = RGBColor(0x05, 0x96, 0x69)
VERDE_SUAVE = RGBColor(0xD1, 0xFA, 0xE5)
FUENTE = "Segoe UI"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
VACIO = prs.slide_layouts[6]


def escena(fondo):
    s = prs.slides.add_slide(VACIO)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = fondo
    return s


def texto(s, nombre, x, y, w, h, lineas, alinear=PP_ALIGN.CENTER, anclar=MSO_ANCHOR.MIDDLE):
    tb = s.shapes.add_textbox(x, y, w, h)
    tb.name = nombre
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anclar
    for i, (t, tam, negrita, color) in enumerate(lineas):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = alinear
        r = p.add_run()
        r.text = t
        r.font.name = FUENTE
        r.font.size = Pt(tam)
        r.font.bold = negrita
        r.font.color.rgb = color
    return tb


def pildora(s, nombre, x, y, w, h, t, relleno, color, tam=28, borde=None):
    b = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    b.name = nombre
    b.adjustments[0] = 0.5
    b.fill.solid()
    b.fill.fore_color.rgb = relleno
    if borde:
        b.line.color.rgb = borde
        b.line.width = Pt(2.5)
    else:
        b.line.fill.background()
    b.shadow.inherit = False
    tf = b.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = t
    r.font.name = FUENTE
    r.font.size = Pt(tam)
    r.font.bold = True
    r.font.color.rgb = color
    return b


def imagen(s, nombre, ruta, x, y, w=None, h=None, borde=True):
    p = s.shapes.add_picture(str(ruta), x, y, w, h)
    p.name = nombre
    if borde:
        p.line.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
        p.line.width = Pt(1)
    return p


def centrar_x(shape):
    shape.left = int((SW - shape.width) / 2)


# 1. Marca ---------------------------------------------------------------
s = escena(OSCURO)
ic = imagen(s, "a1_icono", RECURSOS / "icono.png", 0, Inches(1.35), h=Inches(1.7), borde=False)
centrar_x(ic)
texto(s, "a2_titulo", 0, Inches(3.25), SW, Inches(1.2), [("BioMedManager", 66, True, BLANCO)])
texto(s, "a3_lema", 0, Inches(4.45), SW, Inches(0.9),
      [("Gestión de equipos biomédicos, sin sorpresas", 28, False, TEAL_CLARO)])

# 2. Problema ------------------------------------------------------------
s = escena(FONDO)
texto(s, "a1_pregunta", Inches(1), Inches(1.6), Inches(11.33), Inches(2.0),
      [("¿Tu inventario de equipos", 46, True, TINTA), ("está en Excel o WhatsApp?", 46, True, TINTA)])
pildora(s, "a2_riesgo", Inches(1.9), Inches(4.35), Inches(9.53), Inches(1.15),
        "⚠  Un equipo con falla puede seguir en uso", ROJO_SUAVE, ROJO, tam=30, borde=ROJO)

# 3. Reportar falla ------------------------------------------------------
s = escena(FONDO)
texto(s, "a1_titulo", Inches(0.7), Inches(1.7), Inches(4.6), Inches(3.8),
      [("Reporta la falla", 40, True, TINTA),
       ("", 12, False, TINTA),
       ("El equipo pasa a «Con falla» al instante y queda en el historial.", 24, False, GRIS)],
      alinear=PP_ALIGN.LEFT)
tarjeta = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.7), Inches(1.6), Inches(6.9), Inches(2.6))
tarjeta.name = "tarjeta"
tarjeta.adjustments[0] = 0.08
tarjeta.fill.solid()
tarjeta.fill.fore_color.rgb = BLANCO
tarjeta.line.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
tarjeta.line.width = Pt(1.25)
texto(s, "t_codigo", Inches(6.1), Inches(1.85), Inches(3.5), Inches(0.5), [("MON-01", 18, False, GRIS)], alinear=PP_ALIGN.LEFT)
texto(s, "t_nombre", Inches(6.1), Inches(2.3), Inches(6.2), Inches(0.8), [("Monitor multiparámetro", 32, True, TINTA)], alinear=PP_ALIGN.LEFT)
texto(s, "t_detalle", Inches(6.1), Inches(3.1), Inches(6.2), Inches(0.6), [("UCI · cama 3", 20, False, GRIS)], alinear=PP_ALIGN.LEFT)
pildora(s, "t_operativo", Inches(9.75), Inches(1.85), Inches(2.55), Inches(0.62), "● Operativo", VERDE_SUAVE, VERDE, tam=18)
pildora(s, "a2_reporte_fly", Inches(5.7), Inches(4.55), Inches(6.9), Inches(0.95), "⚠  Falla reportada: «No enciende»", ROJO_SUAVE, ROJO, tam=24, borde=ROJO)
pildora(s, "a3_confalla", Inches(9.75), Inches(1.85), Inches(2.55), Inches(0.62), "● Con falla", ROJO_SUAVE, ROJO, tam=18, borde=ROJO)

# 4. Regla de salud ------------------------------------------------------
s = escena(OSCURO)
texto(s, "a0_titulo", 0, Inches(0.75), SW, Inches(0.9),
      [("La regla que Excel no tiene", 36, True, BLANCO)])
pildora(s, "a1_confalla", Inches(0.7), Inches(2.4), Inches(3.3), Inches(1.0), "● Con falla", ROJO_SUAVE, ROJO, tam=26)
texto(s, "a2_flecha", Inches(4.0), Inches(2.4), Inches(0.6), Inches(1.0), [("→", 36, True, TEAL_CLARO)])
pildora(s, "a3_intento", Inches(4.6), Inches(2.4), Inches(3.9), Inches(1.0), "Marcar operativo", BLANCO, TINTA, tam=24)
texto(s, "a4_flecha", Inches(8.5), Inches(2.4), Inches(0.6), Inches(1.0), [("→", 36, True, TEAL_CLARO)])
pildora(s, "a5_bloqueado", Inches(9.1), Inches(2.25), Inches(3.55), Inches(1.3), "BLOQUEADO", ROJO, BLANCO, tam=30)
texto(s, "a6_explica", 0, Inches(3.95), SW, Inches(0.8),
      [("Hasta resolverla con una nota de cierre", 26, False, TEAL_CLARO)])
pildora(s, "a7_ok_fly", Inches(4.17), Inches(5.0), Inches(5.0), Inches(1.1), "✓  Operativo", VERDE_SUAVE, VERDE, tam=32)

# 5. Funciones -----------------------------------------------------------
s = escena(FONDO)
texto(s, "a0_titulo", 0, Inches(0.55), SW, Inches(0.9), [("Todo en tu bolsillo", 40, True, TINTA)])
col_w = Inches(3.6)
xs = [Inches(0.9), Inches(4.87), Inches(8.83)]
# Excel
b = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, xs[0] + Inches(0.55), Inches(1.9), Inches(2.5), Inches(3.0))
b.name = "a1_excel"
b.adjustments[0] = 0.1
b.fill.solid()
b.fill.fore_color.rgb = RGBColor(0x10, 0x7C, 0x41)
b.line.fill.background()
tf = b.text_frame
tf.vertical_anchor = MSO_ANCHOR.MIDDLE
for i, (t, tam) in enumerate([("XLSX", 48), ("inventario · reportes", 14), ("historial · indicadores", 14)]):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = t
    r.font.name = FUENTE
    r.font.size = Pt(tam)
    r.font.bold = i == 0
    r.font.color.rgb = BLANCO
texto(s, "a2_excel_txt", xs[0], Inches(5.15), col_w, Inches(0.8), [("Excel en un clic", 24, True, TINTA)])
qr = imagen(s, "a3_qr", RECURSOS / "qr.png", xs[1] + Inches(0.45), Inches(1.75), h=Inches(2.7))
qr.left = xs[1] + int((col_w - qr.width) / 2)
texto(s, "a4_qr_txt", xs[1], Inches(4.6), col_w, Inches(1.3),
      [("Etiqueta QR", 24, True, TINTA), ("escanea y abre la ficha", 16, False, GRIS)])
mov = imagen(s, "a5_movil", CAPTURAS / "registro_movil.png", 0, Inches(1.55), h=Inches(3.45))
mov.left = xs[2] + int((col_w - mov.width) / 2)
texto(s, "a6_movil_txt", xs[2], Inches(5.15), col_w, Inches(0.8), [("App en tu celular", 24, True, TINTA)])

# 6. Cierre --------------------------------------------------------------
s = escena(OSCURO)
ic = imagen(s, "a1_icono", RECURSOS / "icono.png", 0, Inches(1.2), h=Inches(1.3), borde=False)
centrar_x(ic)
texto(s, "a2_marca", 0, Inches(2.65), SW, Inches(1.0), [("BioMedManager", 54, True, BLANCO)])
pildora(s, "a3_url", Inches(3.17), Inches(3.95), Inches(7.0), Inches(1.0), "biomedmanager.vercel.app", BLANCO, TEAL, tam=30)
texto(s, "a4_pie", 0, Inches(5.6), SW, Inches(0.6),
      [("Prototipo académico · Ingeniería Biomédica · Yachay Tech", 16, False, TEAL_CLARO)])

prs.save(SALIDA)
print("escenas:", len(prs.slides), "->", SALIDA)
