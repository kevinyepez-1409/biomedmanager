param([string]$pptx, [string]$mp4)
# Aplica animaciones y tiempos a las escenas y exporta el video MP4.
$duraciones = @(2.6, 2.8, 3.0, 3.4, 3.0, 2.6)
$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open($pptx, $false, $false, $false)
  for ($i = 1; $i -le $pres.Slides.Count; $i++) {
    $slide = $pres.Slides.Item($i)
    $t = $slide.SlideShowTransition
    $t.EntryEffect = 3849          # ppEffectFadeSmoothly
    $t.Duration = 0.5
    $t.AdvanceOnClick = 0
    $t.AdvanceOnTime = -1
    $t.AdvanceTime = $duraciones[$i - 1]

    $animadas = @()
    foreach ($sh in $slide.Shapes) { if ($sh.Name -match '^a\d') { $animadas += $sh } }
    $animadas = $animadas | Sort-Object Name
    foreach ($sh in $animadas) {
      $efecto = if ($sh.Name -like '*_fly') { 2 } else { 10 }   # Fly / Fade
      $e = $slide.TimeLine.MainSequence.AddEffect($sh, $efecto, 0, 3)  # AfterPrevious
      $e.Timing.Duration = 0.35
      $e.Timing.TriggerDelayTime = 0.05
    }
  }
  $pres.Save()
  $pres.CreateVideo($mp4, $true, 3, 1080, 30, 100)
  $inicio = Get-Date
  while ($pres.CreateVideoStatus -eq 1 -or $pres.CreateVideoStatus -eq 2) {
    Start-Sleep -Seconds 2
    if (((Get-Date) - $inicio).TotalSeconds -gt 300) { throw "Tiempo de exportacion agotado" }
  }
  "estado final: " + $pres.CreateVideoStatus + " (3 = listo)"
  $pres.Close()
} finally { $app.Quit() }
