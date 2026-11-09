param(
  [string]$OutputDirectory = 'assets\qr-prueba'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$items = @(
  @{ Archivo = 'qr-lug-001.png'; Codigo = 'COLON:lug-001'; Nombre = 'Termas de Col&oacute;n'; Clase = '' },
  @{ Archivo = 'qr-lug-002.png'; Codigo = 'COLON:lug-002'; Nombre = 'Playa Norte'; Clase = '' },
  @{ Archivo = 'qr-lug-003.png'; Codigo = 'COLON:lug-003'; Nombre = 'Balneario Piedras Coloradas'; Clase = '' },
  @{ Archivo = 'qr-lug-004.png'; Codigo = 'COLON:lug-004'; Nombre = 'Molino Forclaz'; Clase = '' },
  @{ Archivo = 'qr-lug-005.png'; Codigo = 'COLON:lug-005'; Nombre = 'Museo Casa de la Cultura'; Clase = '' },
  @{ Archivo = 'qr-lug-006.png'; Codigo = 'COLON:lug-006'; Nombre = 'Parque Nacional El Palmar'; Clase = '' },
  @{ Archivo = 'qr-lug-007.png'; Codigo = 'COLON:lug-007'; Nombre = 'Puerto Viejo'; Clase = '' },
  @{ Archivo = 'qr-lug-010.png'; Codigo = 'COLON:lug-010'; Nombre = 'Paseo de Artesanos'; Clase = '' },
  @{ Archivo = 'qr-invalido.png'; Codigo = 'COLON:qr-invalido'; Nombre = 'Prueba inv&aacute;lida'; Clase = 'invalid' }
)

foreach ($item in $items) {
  $destino = Join-Path $OutputDirectory $item.Archivo
  npx.cmd --yes qrcode -t png -w 700 -e H -q 4 -o $destino $item.Codigo | Out-Null
  Write-Host ("Generado: " + $destino + " -> " + $item.Codigo)
}

# La plancha queda autocontenida para que funcione aunque se abra desde
# GitHub, una descarga individual o una carpeta distinta a la del proyecto.
$cards = foreach ($item in $items) {
  $path = Join-Path $OutputDirectory $item.Archivo
  $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
  @"
      <article class="card $($item.Clase)"><img src="data:image/png;base64,$base64" alt="QR $($item.Nombre)"><h2>$($item.Nombre)</h2><div class="code">$($item.Codigo)</div></article>
"@
}

$html = @"
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QR de prueba &mdash; Mi Ciudad Col&oacute;n</title>
  <style>
    body { margin: 0; background: #f7f4ee; color: #193746; font-family: Segoe UI, Arial, sans-serif; }
    main { max-width: 1000px; margin: 0 auto; padding: 28px; }
    h1 { color: #0e5a74; margin-bottom: 6px; }
    .intro { margin-top: 0; color: #547180; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
    .card { background: white; border: 1px solid #dfd5c6; border-radius: 18px; padding: 16px; text-align: center; break-inside: avoid; }
    .card img { width: 100%; max-width: 220px; image-rendering: auto; }
    .card h2 { color: #0e5a74; font-size: 18px; margin: 8px 0 2px; }
    .code { color: #6c8c4a; font-family: Consolas, monospace; font-weight: 700; }
    .invalid { border-color: #b86b5c; }
    .invalid h2 { color: #9b4e3e; }
    @media print { body { background: white; } main { max-width: none; } .grid { grid-template-columns: repeat(3, 1fr); } }
  </style>
</head>
<body>
  <main>
    <h1>QR de prueba &mdash; Mi Ciudad Col&oacute;n</h1>
    <p class="intro">Imprimir o mostrar desde otra pantalla para validar el lector QR. Los c&oacute;digos contienen exactamente los valores del cat&aacute;logo local.</p>
    <section class="grid">
$($cards -join "`n")
    </section>
  </main>
</body>
</html>
"@

Set-Content -LiteralPath (Join-Path $projectRoot 'QR_PRUEBAS.html') -Value $html -Encoding UTF8
Write-Host 'Plancha autocontenida generada: QR_PRUEBAS.html'
