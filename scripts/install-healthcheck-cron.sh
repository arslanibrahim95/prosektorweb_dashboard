#!/usr/bin/env bash
set -euo pipefail

CRON_FILE="${CRON_FILE:-/etc/cron.d/prosektor-healthcheck}"
CRON_SCHEDULE="${CRON_SCHEDULE:-*/15 * * * *}"
LOCAL_APP_BASE_URL="${LOCAL_APP_BASE_URL:-http://localhost:8080}"
EXTERNAL_HEALTH_URL="${EXTERNAL_HEALTH_URL:-}"
LOG_FILE="${LOG_FILE:-/var/log/prosektor-healthcheck.log}"
HEALTH_SCRIPT="${HEALTH_SCRIPT:-/var/www/prosektorweb_dashboard/scripts/healthcheck-critical.sh}"
HEALTH_RETRY_COUNT="${HEALTH_RETRY_COUNT:-6}"
HEALTH_RETRY_DELAY_SEC="${HEALTH_RETRY_DELAY_SEC:-2}"

log() {
  printf '[health-cron] %s\n' "$*"
}

main() {
  if [[ "${EUID}" -ne 0 ]]; then
    log "ERROR: Please run as root."
    exit 1
  fi

  if [[ ! -x "${HEALTH_SCRIPT}" ]]; then
    log "ERROR: health script is missing or not executable: ${HEALTH_SCRIPT}"
    exit 1
  fi

  mkdir -p "$(dirname "${CRON_FILE}")"
  mkdir -p "$(dirname "${LOG_FILE}")"
  touch "${LOG_FILE}"

  local cron_cmd
  cron_cmd="APP_BASE_URL='${LOCAL_APP_BASE_URL}' HEALTH_RETRY_COUNT='${HEALTH_RETRY_COUNT}' HEALTH_RETRY_DELAY_SEC='${HEALTH_RETRY_DELAY_SEC}' '${HEALTH_SCRIPT}'"
  if [[ -n "${EXTERNAL_HEALTH_URL}" ]]; then
    cron_cmd="${cron_cmd} && APP_BASE_URL='${EXTERNAL_HEALTH_URL}' HEALTH_RETRY_COUNT='${HEALTH_RETRY_COUNT}' HEALTH_RETRY_DELAY_SEC='${HEALTH_RETRY_DELAY_SEC}' '${HEALTH_SCRIPT}'"
  fi

  cat > "${CRON_FILE}" <<EOF_CRON
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
${CRON_SCHEDULE} root ${cron_cmd} >> '${LOG_FILE}' 2>&1
EOF_CRON

  chmod 644 "${CRON_FILE}"

  log "Installed cron file: ${CRON_FILE}"
  log "Schedule: ${CRON_SCHEDULE}"
  log "Local URL: ${LOCAL_APP_BASE_URL}"
  if [[ -n "${EXTERNAL_HEALTH_URL}" ]]; then
    log "External URL: ${EXTERNAL_HEALTH_URL}"
  fi
  log "Log file: ${LOG_FILE}"
}

main "$@"
