param(
  [switch]$ExportAndroid
)

$ErrorActionPreference = 'Continue'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

$results = [System.Collections.Generic.List[object]]::new()

function Invoke-QACheck {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [ValidateSet('PASS', 'WARN')][string]$ExpectedLevel = 'PASS'
  )

  Write-Host ""
  Write-Host ("== " + $Name + " ==") -ForegroundColor Cyan
  & $Command @Arguments
  $exitCode = $LASTEXITCODE

  if ($exitCode -eq 0) {
    if ($ExpectedLevel -eq 'WARN') {
      Write-Host ("PASS: " + $Name + ". Revisar igualmente las vulnerabilidades Moderate informadas por npm.") -ForegroundColor Yellow
    } else {
      Write-Host ("PASS: " + $Name) -ForegroundColor Green
    }
    $results.Add([pscustomobject]@{ Nombre = $Name; Estado = 'PASS'; Codigo = $exitCode })
    return
  }

  $state = if ($ExpectedLevel -eq 'WARN') { 'WARN' } else { 'FAIL' }
  $color = if ($state -eq 'WARN') { 'Yellow' } else { 'Red' }
  Write-Host ($state + ': ' + $Name + ' (codigo ' + $exitCode + ')') -ForegroundColor $color
  $results.Add([pscustomobject]@{ Nombre = $Name; Estado = $state; Codigo = $exitCode })
}

Write-Host "AUDITORIA QA AUTOMATIZADA - Mi Ciudad Colon" -ForegroundColor White
Write-Host ("Proyecto: " + $projectRoot)
Write-Host ("Fecha: " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))

Invoke-QACheck -Name 'TypeScript' -Command 'npm.cmd' -Arguments @('run', 'typecheck')
Invoke-QACheck -Name 'Expo Doctor' -Command 'npx.cmd' -Arguments @('expo-doctor')
Invoke-QACheck -Name 'Auditoria de dependencias (umbral High/Critical)' -Command 'npm.cmd' -Arguments @('audit', '--omit=dev', '--audit-level=high') -ExpectedLevel 'WARN'

$adbCommand = Get-Command adb.exe -ErrorAction SilentlyContinue
if ($null -eq $adbCommand) {
  Write-Host "WARN: ADB no esta disponible en el PATH." -ForegroundColor Yellow
  $results.Add([pscustomobject]@{ Nombre = 'ADB'; Estado = 'WARN'; Codigo = $null })
} else {
  Write-Host ""
  Write-Host "== Dispositivos Android ==" -ForegroundColor Cyan
  $adbOutput = & adb.exe devices
  $adbOutput | ForEach-Object { Write-Host $_ }
  $connected = @($adbOutput | Where-Object { $_ -match '\tdevice$' }).Count
  if ($connected -gt 0) {
    Write-Host "PASS: hay al menos un dispositivo Android conectado." -ForegroundColor Green
    $results.Add([pscustomobject]@{ Nombre = 'ADB'; Estado = 'PASS'; Codigo = 0 })
  } else {
    Write-Host "WARN: no hay un dispositivo Android autorizado." -ForegroundColor Yellow
    $results.Add([pscustomobject]@{ Nombre = 'ADB'; Estado = 'WARN'; Codigo = 0 })
  }
}

if ($ExportAndroid) {
  $outputDir = "dist-qa-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Invoke-QACheck -Name ("Exportacion Android (" + $outputDir + ")") -Command 'npx.cmd' -Arguments @('expo', 'export', '--platform', 'android', '--output-dir', $outputDir)
}

Write-Host ""
Write-Host "== Resumen ==" -ForegroundColor Cyan
$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Pruebas manuales pendientes en el Pova 6:" -ForegroundColor Yellow
Write-Host "QA-001 a QA-010: arranque, permisos y navegacion."
Write-Host "QA-029 a QA-035: QR y geolocalizacion."
Write-Host "QA-038 a QA-042: audio y TTS."
Write-Host "QA-052 a QA-062: offline, rendimiento y accesibilidad."

$failed = @($results | Where-Object { $_.Estado -eq 'FAIL' }).Count
if ($failed -gt 0) {
  exit 1
}

exit 0

