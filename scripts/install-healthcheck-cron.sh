#!/usr/bin/env bash
set -euo pipefail

CRON_FILE="${CRON_FILE:-/etc/cron.d/prosektor-healthcheck}"
CRON_SCHEDULE="${CRON_SCHEDULE:-*/15 * * * *}"
MONITORING_ENV_FILE="${MONITORING_ENV_FILE:-/etc/default/prosektor-monitoring}"
LOCAL_APP_BASE_URL="${LOCAL_APP_BASE_URL:-http://localhost:8080}"
EXTERNAL_HEALTH_URL="${EXTERNAL_HEALTH_URL:-}"
LOG_FILE="${LOG_FILE:-/var/log/prosektor-healthcheck.log}"
RUNNER_SCRIPT="${RUNNER_SCRIPT:-/var/www/prosektorweb_dashboard/scripts/run-healthcheck-with-alert.sh}"
HEALTH_RETRY_COUNT="${HEALTH_RETRY_COUNT:-6}"
HEALTH_RETRY_DELAY_SEC="${HEALTH_RETRY_DELAY_SEC:-2}"
ALERT_COOLDOWN_SEC="${ALERT_COOLDOWN_SEC:-1800}"
ALERT_SEND_RECOVERY="${ALERT_SEND_RECOVERY:-1}"

ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
ALERT_TELEGRAM_BOT_TOKEN="${ALERT_TELEGRAM_BOT_TOKEN:-}"
ALERT_TELEGRAM_CHAT_ID="${ALERT_TELEGRAM_CHAT_ID:-}"
ALERT_EMAIL_TO="${ALERT_EMAIL_TO:-}"
ALERT_EMAIL_SUBJECT_PREFIX="${ALERT_EMAIL_SUBJECT_PREFIX:-[Prosektor Health]}"

# Preserve explicit CLI/env overrides across loading existing config.
INPUT_LOCAL_APP_BASE_URL="${LOCAL_APP_BASE_URL}"
INPUT_EXTERNAL_HEALTH_URL="${EXTERNAL_HEALTH_URL}"
INPUT_HEALTH_RETRY_COUNT="${HEALTH_RETRY_COUNT}"
INPUT_HEALTH_RETRY_DELAY_SEC="${HEALTH_RETRY_DELAY_SEC}"
INPUT_ALERT_COOLDOWN_SEC="${ALERT_COOLDOWN_SEC}"
INPUT_ALERT_SEND_RECOVERY="${ALERT_SEND_RECOVERY}"
INPUT_ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL}"
INPUT_ALERT_TELEGRAM_BOT_TOKEN="${ALERT_TELEGRAM_BOT_TOKEN}"
INPUT_ALERT_TELEGRAM_CHAT_ID="${ALERT_TELEGRAM_CHAT_ID}"
INPUT_ALERT_EMAIL_TO="${ALERT_EMAIL_TO}"
INPUT_ALERT_EMAIL_SUBJECT_PREFIX="${ALERT_EMAIL_SUBJECT_PREFIX}"

log() {
  printf '[health-cron] %s\n' "$*"
}

load_existing_monitoring_env() {
  if [[ -f "${MONITORING_ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${MONITORING_ENV_FILE}"
    set +a

    [[ -n "${INPUT_LOCAL_APP_BASE_URL}" ]] && LOCAL_APP_BASE_URL="${INPUT_LOCAL_APP_BASE_URL}"
    [[ -n "${INPUT_EXTERNAL_HEALTH_URL}" ]] && EXTERNAL_HEALTH_URL="${INPUT_EXTERNAL_HEALTH_URL}"
    [[ -n "${INPUT_HEALTH_RETRY_COUNT}" ]] && HEALTH_RETRY_COUNT="${INPUT_HEALTH_RETRY_COUNT}"
    [[ -n "${INPUT_HEALTH_RETRY_DELAY_SEC}" ]] && HEALTH_RETRY_DELAY_SEC="${INPUT_HEALTH_RETRY_DELAY_SEC}"
    [[ -n "${INPUT_ALERT_COOLDOWN_SEC}" ]] && ALERT_COOLDOWN_SEC="${INPUT_ALERT_COOLDOWN_SEC}"
    [[ -n "${INPUT_ALERT_SEND_RECOVERY}" ]] && ALERT_SEND_RECOVERY="${INPUT_ALERT_SEND_RECOVERY}"
    [[ -n "${INPUT_ALERT_WEBHOOK_URL}" ]] && ALERT_WEBHOOK_URL="${INPUT_ALERT_WEBHOOK_URL}"
    [[ -n "${INPUT_ALERT_TELEGRAM_BOT_TOKEN}" ]] && ALERT_TELEGRAM_BOT_TOKEN="${INPUT_ALERT_TELEGRAM_BOT_TOKEN}"
    [[ -n "${INPUT_ALERT_TELEGRAM_CHAT_ID}" ]] && ALERT_TELEGRAM_CHAT_ID="${INPUT_ALERT_TELEGRAM_CHAT_ID}"
    [[ -n "${INPUT_ALERT_EMAIL_TO}" ]] && ALERT_EMAIL_TO="${INPUT_ALERT_EMAIL_TO}"
    [[ -n "${INPUT_ALERT_EMAIL_SUBJECT_PREFIX}" ]] && ALERT_EMAIL_SUBJECT_PREFIX="${INPUT_ALERT_EMAIL_SUBJECT_PREFIX}"
  fi
}

auto_configure_ntfy() {
  if [[ -n "${ALERT_WEBHOOK_URL}" || -n "${ALERT_TELEGRAM_BOT_TOKEN}" || -n "${ALERT_EMAIL_TO}" ]]; then
    return 0
  fi

  local host rand topic
  host="$(hostname | tr -cd 'a-zA-Z0-9-' | tr '[:upper:]' '[:lower:]')"
  rand="$(head -c 6 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  topic="prosektor-${host}-${rand}"
  ALERT_WEBHOOK_URL="https://ntfy.sh/${topic}"
  log "No alert channel configured. Auto-configured ntfy topic: ${ALERT_WEBHOOK_URL}"
}

write_monitoring_env() {
  mkdir -p "$(dirname "${MONITORING_ENV_FILE}")"
  cat > "${MONITORING_ENV_FILE}" <<EOF_ENV
LOCAL_APP_BASE_URL='${LOCAL_APP_BASE_URL}'
EXTERNAL_HEALTH_URL='${EXTERNAL_HEALTH_URL}'
HEALTH_RETRY_COUNT='${HEALTH_RETRY_COUNT}'
HEALTH_RETRY_DELAY_SEC='${HEALTH_RETRY_DELAY_SEC}'
ALERT_COOLDOWN_SEC='${ALERT_COOLDOWN_SEC}'
ALERT_SEND_RECOVERY='${ALERT_SEND_RECOVERY}'
ALERT_WEBHOOK_URL='${ALERT_WEBHOOK_URL}'
ALERT_TELEGRAM_BOT_TOKEN='${ALERT_TELEGRAM_BOT_TOKEN}'
ALERT_TELEGRAM_CHAT_ID='${ALERT_TELEGRAM_CHAT_ID}'
ALERT_EMAIL_TO='${ALERT_EMAIL_TO}'
ALERT_EMAIL_SUBJECT_PREFIX='${ALERT_EMAIL_SUBJECT_PREFIX}'
EOF_ENV
  chmod 600 "${MONITORING_ENV_FILE}"
}

main() {
  if [[ "${EUID}" -ne 0 ]]; then
    log "ERROR: Please run as root."
    exit 1
  fi

  if [[ ! -x "${RUNNER_SCRIPT}" ]]; then
    log "ERROR: health runner is missing or not executable: ${RUNNER_SCRIPT}"
    exit 1
  fi

  load_existing_monitoring_env
  auto_configure_ntfy
  write_monitoring_env

  mkdir -p "$(dirname "${CRON_FILE}")"
  mkdir -p "$(dirname "${LOG_FILE}")"
  touch "${LOG_FILE}"

  cat > "${CRON_FILE}" <<EOF_CRON
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
${CRON_SCHEDULE} root MONITORING_ENV_FILE='${MONITORING_ENV_FILE}' '${RUNNER_SCRIPT}' >> '${LOG_FILE}' 2>&1
EOF_CRON

  chmod 644 "${CRON_FILE}"

  log "Installed cron file: ${CRON_FILE}"
  log "Schedule: ${CRON_SCHEDULE}"
  log "Monitoring env: ${MONITORING_ENV_FILE}"
  log "Log file: ${LOG_FILE}"
}

main "$@"
