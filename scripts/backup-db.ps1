param(
  [string]$OutputDirectory = ".\backups",
  [string]$ComposeFile = "docker-compose.prod.yml",
  [string]$EnvironmentFile = ".env.production"
)

$ErrorActionPreference = "Stop"
$resolvedOutput = [System.IO.Path]::GetFullPath((Join-Path $PWD $OutputDirectory))
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $resolvedOutput "lms-$stamp.sql"

docker compose --env-file $EnvironmentFile -f $ComposeFile exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' | Set-Content -Encoding utf8 $target
if ($LASTEXITCODE -ne 0) { throw "Database backup failed" }
Write-Host "Backup created: $target"
