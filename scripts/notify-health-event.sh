#!/usr/bin/env bash
set -euo pipefail

EVENT_TYPE="${1:-failure}" # failure | recovery
SUMMARY="${2:-Healthcheck event}"
DETAILS_FILE="${3:-}"

ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
ALERT_TELEGRAM_BOT_TOKEN="${ALERT_TELEGRAM_BOT_TOKEN:-}"
ALERT_TELEGRAM_CHAT_ID="${ALERT_TELEGRAM_CHAT_ID:-}"
ALERT_EMAIL_TO="${ALERT_EMAIL_TO:-}"
ALERT_EMAIL_SUBJECT_PREFIX="${ALERT_EMAIL_SUBJECT_PREFIX:-[Prosektor Health]}"

log() {
  printf '[notify] %s\n' "$*"
}

build_message() {
  local host ts details=""
  host="$(hostname -f 2>/dev/null || hostname)"
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  if [[ -n "${DETAILS_FILE}" && -f "${DETAILS_FILE}" ]]; then
    details="$(tail -n 200 "${DETAILS_FILE}")"
  fi

  printf '[%s] %s on %s\n%s\n' "${ts}" "${SUMMARY}" "${host}" "${details}"
}

send_webhook() {
  local message="$1"
  [[ -n "${ALERT_WEBHOOK_URL}" ]] || return 1

  if [[ "${ALERT_WEBHOOK_URL}" == *"ntfy.sh/"* ]]; then
    curl -fsS \
      -H "Title: Prosektor Health ${EVENT_TYPE}" \
      -H "Priority: 4" \
      -d "${message}" \
      "${ALERT_WEBHOOK_URL}" >/dev/null
    return 0
  fi

  local escaped payload
  escaped="$(printf '%s' "${message}" | sed ':a;N;$!ba;s/\n/\\n/g; s/\\/\\\\/g; s/"/\\"/g')"
  payload="{\"event\":\"${EVENT_TYPE}\",\"text\":\"${escaped}\",\"message\":\"${escaped}\"}"
  curl -fsS -H "Content-Type: application/json" -d "${payload}" "${ALERT_WEBHOOK_URL}" >/dev/null
}

send_telegram() {
  local message="$1"
  [[ -n "${ALERT_TELEGRAM_BOT_TOKEN}" && -n "${ALERT_TELEGRAM_CHAT_ID}" ]] || return 1

  curl -fsS "https://api.telegram.org/bot${ALERT_TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${ALERT_TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${message}" >/dev/null
}

send_email() {
  local message="$1"
  [[ -n "${ALERT_EMAIL_TO}" ]] || return 1
  command -v mail >/dev/null 2>&1 || return 1

  printf '%s\n' "${message}" | mail -s "${ALERT_EMAIL_SUBJECT_PREFIX} ${EVENT_TYPE}" "${ALERT_EMAIL_TO}"
}

main() {
  local message sent=0
  message="$(build_message)"

  if send_webhook "${message}"; then
    log "Webhook alert sent."
    sent=1
  fi

  if send_telegram "${message}"; then
    log "Telegram alert sent."
    sent=1
  fi

  if send_email "${message}"; then
    log "Email alert sent."
    sent=1
  fi

  if [[ "${sent}" -eq 0 ]]; then
    log "No alert channel configured or all channels failed."
    exit 1
  fi
}

main "$@"
