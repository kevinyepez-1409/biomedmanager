param([string]$pptx, [string]$mp4)
# Inserta el anuncio como primera diapositiva, a pantalla completa y con
# reproduccion automatica al entrar en la diapositiva.
# Uso: .\insertar_video.ps1 -pptx <presentacion.pptx> -mp4 <anuncio.mp4>
$pptx = (Resolve-Path $pptx).Path
$mp4 = (Resolve-Path $mp4).Path
$app = New-Object -ComObject PowerPoint.Application
$abiertasAntes = $app.Presentations.Count
try {
  $pres = $app.Presentations.Open($pptx, $false, $false, $false)
  $layout = $pres.Slides.Item(2).CustomLayout   # layout "Blank" del Canvas
  $s = $pres.Slides.AddSlide(1, $layout)
  foreach ($sh in @($s.Shapes)) { $sh.Delete() }
  $s.FollowMasterBackground = 0
  $s.Background.Fill.Solid()
  $s.Background.Fill.ForeColor.RGB = 0                # negro
  $w = $pres.PageSetup.SlideWidth
  $h = $pres.PageSetup.SlideHeight
  $video = $s.Shapes.AddMediaObject2($mp4, 0, -1, 0, 0, $w, $h)
  $video.Name = "Anuncio BioMedManager"
  $video.MediaFormat.SetDisplayPicture(2200)   # portada: fotograma del logo
  $video.AnimationSettings.PlaySettings.PlayOnEntry = -1
  $video.AnimationSettings.PlaySettings.HideWhileNotPlaying = 0
  $s.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = "Anuncio de 20 segundos: se reproduce solo al empezar. Al terminar, pasa a la portada."
  $pres.Save()
  "diapositivas: " + $pres.Slides.Count
  $pres.Close()
} finally {
  # Solo cerrar PowerPoint si no habia otras presentaciones abiertas.
  if ($abiertasAntes -eq 0 -and $app.Presentations.Count -eq 0) { $app.Quit() }
}
