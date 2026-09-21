#!/usr/bin/env bash
# Starts the Spring Boot backend for local development (macOS/Linux/Git Bash).
# Loads secrets from the repo-root .env (git-ignored), checks the required ones
# are present, then runs the Maven Wrapper.
#
#   ./scripts/dev-backend.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="$root/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file. Copy .env.example to .env and fill in the required values." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. <(sed -e 's/\r$//' -e '1s/^\xEF\xBB\xBF//' "$env_file")
set +a

for var in DB_PASSWORD JWT_SECRET; do
  if [[ -z "${!var:-}" ]]; then
    echo "Set $var in .env first." >&2
    exit 1
  fi
done

# Compose points APP_BASE_URL at the Docker backend; locally the default
# (http://localhost:8080) is what the browser can reach.
unset APP_BASE_URL

echo "Starting backend on http://localhost:8080 (MySQL at ${DB_HOST:-localhost}:${DB_PORT:-3306})"
cd "$root/backend"
exec ./mvnw spring-boot:run
