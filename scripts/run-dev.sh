#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_NAME="poker-postgres"
POSTGRES_IMAGE="postgres:16-alpine"
POSTGRES_PORT="5432"

started_container=false

log() {
  printf '[run-dev] %s\n' "$*"
}

ensure_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

wait_for_postgres() {
  local retries=30
  while (( retries > 0 )); do
    if PGPASSWORD=postgres psql -h localhost -p "$POSTGRES_PORT" -U postgres -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    (( retries-- ))
  done
  log "Postgres did not become ready in time"
  return 1
}

start_postgres() {
  ensure_command docker
  ensure_command psql

  if docker ps --filter "name=^/${CONTAINER_NAME}$" --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "Postgres container already running"
    return
  fi

  if docker ps -a --filter "name=^/${CONTAINER_NAME}$" --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "Starting existing Postgres container"
    docker start "$CONTAINER_NAME" >/dev/null
  else
    log "Launching Postgres container"
    docker run \
      --name "$CONTAINER_NAME" \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=poker \
      -p "${POSTGRES_PORT}:5432" \
      -d "$POSTGRES_IMAGE" >/dev/null
    started_container=true
  fi

  wait_for_postgres
  log "Postgres ready on port ${POSTGRES_PORT}"
}

cleanup() {
  trap - EXIT INT TERM
  local code=$?
  log "Shutting down dev services"
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ "$started_container" == true ]]; then
    log "Stopping Postgres container"
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
  exit "$code"
}

trap cleanup EXIT INT TERM

start_postgres

log "Applying Prisma migrations"
if ! direnv exec . pnpm --filter api exec prisma migrate deploy >/dev/null 2>&1; then
  log "Prisma migrate deploy failed"
  exit 1
fi

log "Starting API and frontend dev servers"
mkdir -p "$ROOT_DIR/logs"

pushd "$ROOT_DIR" >/dev/null

if command -v direnv >/dev/null 2>&1; then
  direnv allow . >/dev/null 2>&1 || true
fi

direnv exec . pnpm --filter api dev >> "$ROOT_DIR/logs/api-dev.log" 2>&1 &
API_PID=$!

direnv exec . pnpm --filter frontend dev >> "$ROOT_DIR/logs/frontend-dev.log" 2>&1 &
FRONTEND_PID=$!

popd >/dev/null

log "API log: $ROOT_DIR/logs/api-dev.log"
log "Frontend log: $ROOT_DIR/logs/frontend-dev.log"
log "Press Ctrl+C to stop everything"

wait "$API_PID" "$FRONTEND_PID"
