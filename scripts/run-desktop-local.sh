#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${API_PORT:-3001}"
API_URL="http://127.0.0.1:${API_PORT}"
BUILT_BINARY="${ROOT_DIR}/apps/desktop/src-tauri/target/release/steam-auction-desktop"
DESKTOP_CMD="${DESKTOP_CMD:-}"
API_PID=""
API_LISTENER_PID=""

load_env() {
  if [[ -f "${ROOT_DIR}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env"
    set +a
  fi

  export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
}

find_listener_pid() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"${API_PORT}" -sTCP:LISTEN 2>/dev/null | head -n 1
    return
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :${API_PORT}" 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1
  fi
}

get_process_command() {
  local pid="$1"
  ps -p "${pid}" -o command= 2>/dev/null || true
}

is_workspace_api_process() {
  local pid="$1"
  local command_line

  command_line="$(get_process_command "${pid}")"
  [[ "${command_line}" == *"${ROOT_DIR}"* ]] || [[ "${command_line}" == *"tsx watch src/index.ts"* ]] || [[ "${command_line}" == *"apps/api"* ]]
}

cleanup() {
  if [[ -n "${API_PID}" ]] && kill -0 "${API_PID}" 2>/dev/null; then
    if command -v pgrep >/dev/null 2>&1; then
      CHILD_PIDS="$(pgrep -P "${API_PID}" || true)"
      if [[ -n "${CHILD_PIDS}" ]]; then
        kill ${CHILD_PIDS} 2>/dev/null || true
      fi
    fi
  fi

  if [[ -n "${API_LISTENER_PID}" ]] && kill -0 "${API_LISTENER_PID}" 2>/dev/null; then
    kill "${API_LISTENER_PID}" 2>/dev/null || true
    wait "${API_LISTENER_PID}" 2>/dev/null || true
  fi

  if [[ -n "${API_PID}" ]] && kill -0 "${API_PID}" 2>/dev/null; then
    kill "${API_PID}" 2>/dev/null || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

load_env

EXISTING_PID="$(find_listener_pid || true)"
if [[ -n "${EXISTING_PID}" ]] && kill -0 "${EXISTING_PID}" 2>/dev/null; then
  if is_workspace_api_process "${EXISTING_PID}"; then
    echo "Stopping existing local API on port ${API_PORT} (pid ${EXISTING_PID})..."
    kill "${EXISTING_PID}" 2>/dev/null || true
    wait "${EXISTING_PID}" 2>/dev/null || true
    sleep 1
  else
    echo "Port ${API_PORT} is already in use by another process: $(get_process_command "${EXISTING_PID}")"
    echo "Stop that process first, then run npm run desktop:test again."
    exit 1
  fi
fi

echo "Applying database migrations..."
npm run migrate:deploy --workspace=packages/db >/dev/null

echo "Starting API on ${API_URL}..."
cd "${ROOT_DIR}"
PORT="${API_PORT}" npm run dev --workspace=apps/api &
API_PID=$!

echo "Waiting for API health check..."
for _ in $(seq 1 60); do
  if command -v curl >/dev/null 2>&1; then
    if curl --silent --fail "${API_URL}/health" >/dev/null; then
      break
    fi
  else
    sleep 1
    break
  fi
  sleep 1
done

if command -v curl >/dev/null 2>&1 && ! curl --silent --fail "${API_URL}/health" >/dev/null; then
  echo "API did not become ready on ${API_URL}."
  exit 1
fi

API_LISTENER_PID="$(find_listener_pid || true)"

if [[ -n "${DESKTOP_CMD}" ]]; then
  echo "Launching custom desktop command..."
  eval "${DESKTOP_CMD}"
elif command -v steam-auction-desktop >/dev/null 2>&1; then
  echo "Launching installed desktop app..."
  steam-auction-desktop
elif [[ -x "${BUILT_BINARY}" ]]; then
  echo "Launching built desktop binary..."
  "${BUILT_BINARY}"
else
  echo "Desktop app not found. Install the .deb or build apps/desktop first."
  exit 1
fi