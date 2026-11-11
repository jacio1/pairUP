param([Parameter(Mandatory = $true)][string]$SshHost)
$ErrorActionPreference = 'Stop'
if ($SshHost -notmatch '^[a-zA-Z0-9][a-zA-Z0-9_.-]*$') { throw 'Use a configured SSH profile name, e.g. pairup-demo' }
$taskRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $taskRoot '.env'))) { throw 'Generate root .env with node deploy/configure.mjs first' }
$taskArtifacts = Join-Path $taskRoot 'artifacts'
New-Item -ItemType Directory -Path $taskArtifacts -Force | Out-Null
$taskArchive = Join-Path $taskArtifacts 'pairup-deploy.tar.gz'
Push-Location $taskRoot
try {
  # Explicit input paths keep user files, local credentials and dependencies out.
  & tar -czf $taskArchive --exclude=node_modules --exclude=.next --exclude=dist --exclude=client/.env.local --exclude=server/.env --exclude=worker/.env --exclude='*.log' client server worker deploy compose.yaml README.md .env
  if ($LASTEXITCODE -ne 0) { throw 'Packaging failed' }
  & ssh $SshHost 'mkdir -p ~/pairup'
  if ($LASTEXITCODE -ne 0) { throw 'SSH connection failed' }
  & scp $taskArchive "${SshHost}:pairup/pairup-deploy.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw 'Upload failed' }
  & ssh $SshHost 'cd ~/pairup && tar -xzf pairup-deploy.tar.gz && chmod 600 .env && bash deploy/bootstrap.sh'
  if ($LASTEXITCODE -ne 0) { throw 'Deployment failed; inspect the remote output' }
} finally { Pop-Location }
