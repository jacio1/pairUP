$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Push-Location $projectRoot
try {
  $pidPath = Join-Path $projectRoot 'artifacts/home/worker.pid'
  if (Test-Path -LiteralPath $pidPath) {
    $workerProcessId = [int](Get-Content -LiteralPath $pidPath)
    $workerProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$workerProcessId"
    $workerScript = Join-Path $projectRoot 'worker/index.mjs'
    if ($workerProcess -and $workerProcess.CommandLine.Contains($workerScript) -and $workerProcess.CommandLine.Contains('.env.home')) {
      Stop-Process -Id $workerProcessId
    }
  }
  $composeArgs = @('compose', '--env-file', '.env.home', '-f', 'compose.home.yaml')
  if ([regex]::IsMatch((Get-Content -LiteralPath '.env.home' -Raw), '(?m)^CLOUDFLARE_TUNNEL_TOKEN=\S+')) {
    $composeArgs += @('-f', 'compose.home.permanent.yaml')
  }
  & docker @composeArgs --profile public stop
  if ($LASTEXITCODE -ne 0) { throw 'Could not stop the home deployment.' }
} finally { Pop-Location }
