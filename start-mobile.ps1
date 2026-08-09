param(
  [switch]$NoLogs
)

$ErrorActionPreference = "Stop"

function Get-LanIPv4 {
  $interfaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
    Where-Object {
      $_.OperationalStatus -eq [System.Net.NetworkInformation.OperationalStatus]::Up -and
      $_.NetworkInterfaceType -ne [System.Net.NetworkInformation.NetworkInterfaceType]::Loopback
    }

  $candidates = foreach ($networkInterface in $interfaces) {
    $properties = $networkInterface.GetIPProperties()
    $hasIpv4Gateway = $properties.GatewayAddresses |
      Where-Object { $_.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and $_.Address.ToString() -ne "0.0.0.0" }

    if (-not $hasIpv4Gateway) { continue }

    foreach ($address in $properties.UnicastAddresses) {
      if ($address.Address.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { continue }
      $ip = $address.Address.ToString()
      if ($ip.StartsWith("127.") -or $ip.StartsWith("169.254.")) { continue }

      [PSCustomObject]@{
        IP = $ip
        Name = $networkInterface.Name
        Priority = if ($networkInterface.NetworkInterfaceType -eq [System.Net.NetworkInformation.NetworkInterfaceType]::Wireless80211) { 0 } else { 1 }
      }
    }
  }

  return $candidates | Sort-Object Priority | Select-Object -First 1
}

function Set-MobileEnvironmentFile([string]$ipAddress) {
  $environmentPath = Join-Path $PSScriptRoot ".env"
  $values = @()

  if (Test-Path -LiteralPath $environmentPath) {
    $values = @(Get-Content -LiteralPath $environmentPath |
      Where-Object { $_ -notmatch '^MOBILE_HOST_IP=' -and $_ -notmatch '^MOBILE_API_URL=' })
  }

  $values += "MOBILE_HOST_IP=$ipAddress"
  $values += "MOBILE_API_URL=http://${ipAddress}:3000/api/v1"
  Set-Content -LiteralPath $environmentPath -Value $values -Encoding utf8
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker CLI was not found. Install or open Docker Desktop first."
}

$connection = Get-LanIPv4
if (-not $connection) {
  throw "No active Wi-Fi or Ethernet IPv4 address with a default gateway was found."
}

$lanIp = $connection.IP
Set-MobileEnvironmentFile $lanIp

$env:MOBILE_HOST_IP = $lanIp
$env:MOBILE_API_URL = "http://${lanIp}:3000/api/v1"

Write-Host "Detected network: $($connection.Name)" -ForegroundColor Cyan
Write-Host "Laptop IPv4:      $lanIp" -ForegroundColor Cyan
Write-Host "Backend URL:      http://${lanIp}:3000/api/v1" -ForegroundColor Green
Write-Host "Expo URL:         exp://${lanIp}:8081" -ForegroundColor Green

Push-Location $PSScriptRoot
try {
  docker info *> $null
  if ($LASTEXITCODE -ne 0) { throw "Docker Desktop is not running." }

  docker compose up -d postgres backend
  if ($LASTEXITCODE -ne 0) { throw "Could not start PostgreSQL and backend." }

  docker compose up -d --force-recreate mobile
  if ($LASTEXITCODE -ne 0) { throw "Could not start the mobile container." }

  Write-Host "`nMobile is ready. Scan the new QR code in Expo Go." -ForegroundColor Yellow
  if (-not $NoLogs) {
    docker compose logs -f mobile
  }
}
finally {
  Pop-Location
}
