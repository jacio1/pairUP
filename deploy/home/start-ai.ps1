$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$workerScript = Join-Path $projectRoot 'worker/index.mjs'
$workerEnv = Join-Path $projectRoot 'worker/.env.home'
$runtimeDir = Join-Path $projectRoot 'artifacts/home'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$pidPath = Join-Path $runtimeDir 'worker.pid'
if (Test-Path -LiteralPath $pidPath) {
  $workerProcessId = [int](Get-Content -LiteralPath $pidPath)
  $existing = Get-CimInstance Win32_Process -Filter "ProcessId=$workerProcessId"
  if ($existing -and $existing.CommandLine.Contains($workerScript) -and $existing.CommandLine.Contains('.env.home')) {
    Write-Host 'The home AI worker is already running.'
    exit 0
  }
}
if (-not (Test-Path -LiteralPath $workerEnv)) { throw 'Run deploy/home/start.ps1 first.' }
$nodeExecutable = (Get-Command node).Source
$workerProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @("--env-file=$workerEnv", $workerScript) -WorkingDirectory (Join-Path $projectRoot 'worker') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'worker.log') -RedirectStandardError (Join-Path $runtimeDir 'worker-error.log') -PassThru
Set-Content -LiteralPath $pidPath -Value $workerProcess.Id
Write-Host 'Home AI worker started. Warm-up status: artifacts/home/worker.log'
