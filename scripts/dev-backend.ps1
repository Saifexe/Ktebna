# Starts the Spring Boot backend for local development.
# Loads secrets from the repo-root .env (git-ignored) into this process only,
# checks the required ones are present, then runs the Maven Wrapper.
#
#   powershell -ExecutionPolicy Bypass -File scripts\dev-backend.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

if (-not (Test-Path $envFile)) {
    Write-Error "Missing $envFile. Copy .env.example to .env and fill in the required values."
}

foreach ($line in Get-Content $envFile -Encoding UTF8) {
    $line = $line.Trim().TrimStart([char]0xFEFF)
    if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) { continue }
    $key, $value = $line.Split("=", 2)
    [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim().Trim('"').Trim("'"), "Process")
}

$missing = @("DB_PASSWORD", "JWT_SECRET") | Where-Object { -not [Environment]::GetEnvironmentVariable($_, "Process") }
if ($missing) {
    Write-Error "Set these in .env first: $($missing -join ', ')"
}

# Compose points APP_BASE_URL at the Docker backend; locally the default
# (http://localhost:8080) is what the browser can reach.
Remove-Item Env:APP_BASE_URL -ErrorAction SilentlyContinue

$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
Write-Host "Starting backend on http://localhost:8080 (MySQL at ${dbHost}:${dbPort})" -ForegroundColor Cyan
Push-Location (Join-Path $root "backend")
try {
    & .\mvnw.cmd spring-boot:run
} finally {
    Pop-Location
}
