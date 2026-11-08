param(
  [string]$OutputDirectory = 'assets\qr-prueba'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$items = @(
  @{ Archivo = 'qr-lug-001.png'; Codigo = 'COLON:lug-001' },
  @{ Archivo = 'qr-lug-002.png'; Codigo = 'COLON:lug-002' },
  @{ Archivo = 'qr-lug-003.png'; Codigo = 'COLON:lug-003' },
  @{ Archivo = 'qr-lug-004.png'; Codigo = 'COLON:lug-004' },
  @{ Archivo = 'qr-lug-005.png'; Codigo = 'COLON:lug-005' },
  @{ Archivo = 'qr-lug-006.png'; Codigo = 'COLON:lug-006' },
  @{ Archivo = 'qr-lug-007.png'; Codigo = 'COLON:lug-007' },
  @{ Archivo = 'qr-lug-010.png'; Codigo = 'COLON:lug-010' },
  @{ Archivo = 'qr-invalido.png'; Codigo = 'COLON:qr-invalido' }
)

foreach ($item in $items) {
  $destino = Join-Path $OutputDirectory $item.Archivo
  npx.cmd --yes qrcode -t png -w 700 -e H -q 4 -o $destino $item.Codigo | Out-Null
  Write-Host ("Generado: " + $destino + " -> " + $item.Codigo)
}
