param([switch]$Build)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Push-Location $projectRoot
try {
  node deploy/home/configure.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Home configuration failed.' }
  $composeArgs = @('compose', '--env-file', '.env.home', '-f', 'compose.home.yaml')
  $deploymentEnv = Get-Content -LiteralPath '.env.home' -Raw
  $permanent = [regex]::IsMatch($deploymentEnv, '(?m)^CLOUDFLARE_TUNNEL_TOKEN=\S+')
  if ($permanent) { $composeArgs += @('-f', 'compose.home.permanent.yaml') }
  $upArgs = @('up', '-d')
  if ($Build) { $upArgs += '--build' }
  & docker @composeArgs @upArgs db server client proxy
  if ($LASTEXITCODE -ne 0) { throw 'Application startup failed. Check Docker Desktop.' }
  & docker @composeArgs --profile public up -d tunnel
  if ($LASTEXITCODE -ne 0) { throw 'Tunnel startup failed.' }
  $publicUrl = $null
  if ($permanent) {
    $originMatch = [regex]::Match($deploymentEnv, '(?m)^PUBLIC_ORIGIN=(https://[^\s]+)')
    if (-not $originMatch.Success) { throw 'Set PUBLIC_ORIGIN to the permanent HTTPS domain in .env.home.' }
    $publicUrl = $originMatch.Groups[1].Value
  } else {
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
      $tunnelLog = (& docker @composeArgs logs --no-color --tail 100 tunnel 2>&1) -join "`n"
      $matchesFound = [regex]::Matches($tunnelLog, 'https://[a-z0-9-]+\.trycloudflare\.com')
      if ($matchesFound.Count -gt 0) { $publicUrl = $matchesFound[$matchesFound.Count - 1].Value; break }
      Start-Sleep -Seconds 2
    }
  }
  if (-not $publicUrl) { throw 'No tunnel URL received. Check: docker compose --env-file .env.home -f compose.home.yaml logs tunnel' }
  $envPath = Join-Path $projectRoot '.env.home'
  $envText = Get-Content -LiteralPath $envPath -Raw
  $envText = [regex]::Replace($envText, '(?m)^PUBLIC_ORIGIN=.*$', "PUBLIC_ORIGIN=$publicUrl")
  [System.IO.File]::WriteAllText($envPath, $envText, [System.Text.UTF8Encoding]::new($false))
  & docker @composeArgs up -d --no-deps server
  if ($LASTEXITCODE -ne 0) { throw 'Server origin update failed.' }
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
      $health = Invoke-RestMethod -Uri 'http://127.0.0.1:18080/api/health' -TimeoutSec 2
      if ($health.ok) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
  }
  if (-not $ready) { throw 'The server has not become ready. Check Docker logs.' }
  Write-Host "PairUp public address: $publicUrl"
  Write-Host 'Presenter password: PRESENTER_PASSWORD in the private .env.home file.'
  Write-Host 'Keep Docker Desktop and this PC running. Start the local AI worker separately.'
} finally { Pop-Location }
