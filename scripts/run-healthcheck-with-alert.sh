#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONITORING_ENV_FILE="${MONITORING_ENV_FILE:-/etc/default/prosektor-monitoring}"
HEALTH_SCRIPT="${HEALTH_SCRIPT:-${ROOT_DIR}/scripts/healthcheck-critical.sh}"
NOTIFY_SCRIPT="${NOTIFY_SCRIPT:-${ROOT_DIR}/scripts/notify-health-event.sh}"
STATE_FILE="${STATE_FILE:-/var/tmp/prosektor-health-state}"
ALERT_LAST_FILE="${ALERT_LAST_FILE:-/var/tmp/prosektor-health-last-alert-epoch}"
TMP_DIR=""

LOCAL_APP_BASE_URL="${LOCAL_APP_BASE_URL:-http://localhost:8080}"
EXTERNAL_HEALTH_URL="${EXTERNAL_HEALTH_URL:-}"
HEALTH_RETRY_COUNT="${HEALTH_RETRY_COUNT:-6}"
HEALTH_RETRY_DELAY_SEC="${HEALTH_RETRY_DELAY_SEC:-2}"
ALERT_COOLDOWN_SEC="${ALERT_COOLDOWN_SEC:-1800}"
ALERT_SEND_RECOVERY="${ALERT_SEND_RECOVERY:-1}"

log() {
  printf '[health-runner] %s\n' "$*"
}

cleanup() {
  if [[ -n "${TMP_DIR}" && -d "${TMP_DIR}" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}

load_monitoring_env() {
  if [[ -f "${MONITORING_ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${MONITORING_ENV_FILE}"
    set +a
  fi
}

should_send_failure_alert() {
  local now last
  now="$(date +%s)"
  if [[ -f "${ALERT_LAST_FILE}" ]]; then
    last="$(cat "${ALERT_LAST_FILE}" 2>/dev/null || echo 0)"
  else
    last=0
  fi

  if ! [[ "${last}" =~ ^[0-9]+$ ]]; then
    last=0
  fi

  if (( now - last >= ALERT_COOLDOWN_SEC )); then
    printf '%s\n' "${now}" > "${ALERT_LAST_FILE}"
    return 0
  fi
  return 1
}

run_one_check() {
  local label="$1"
  local url="$2"
  local output_file="$3"

  if APP_BASE_URL="${url}" HEALTH_RETRY_COUNT="${HEALTH_RETRY_COUNT}" HEALTH_RETRY_DELAY_SEC="${HEALTH_RETRY_DELAY_SEC}" "${HEALTH_SCRIPT}" > "${output_file}" 2>&1; then
    log "OK ${label} (${url})"
    return 0
  fi

  log "FAIL ${label} (${url})"
  return 1
}

main() {
  load_monitoring_env

  local local_out ext_out any_failed=0
  TMP_DIR="$(mktemp -d)"
  trap cleanup EXIT
  local_out="${TMP_DIR}/local.txt"
  ext_out="${TMP_DIR}/external.txt"

  run_one_check "local" "${LOCAL_APP_BASE_URL}" "${local_out}" || any_failed=1

  if [[ -n "${EXTERNAL_HEALTH_URL}" ]]; then
    run_one_check "external" "${EXTERNAL_HEALTH_URL}" "${ext_out}" || any_failed=1
  fi

  if [[ "${any_failed}" -eq 1 ]]; then
    local details_file summary
    details_file="${TMP_DIR}/details.txt"
    summary="Healthcheck failure"
    {
      echo "Local URL: ${LOCAL_APP_BASE_URL}"
      cat "${local_out}" 2>/dev/null || true
      if [[ -n "${EXTERNAL_HEALTH_URL}" ]]; then
        echo
        echo "External URL: ${EXTERNAL_HEALTH_URL}"
        cat "${ext_out}" 2>/dev/null || true
      fi
    } > "${details_file}"

    if should_send_failure_alert; then
      "${NOTIFY_SCRIPT}" "failure" "${summary}" "${details_file}" || true
    else
      log "Failure alert suppressed by cooldown (${ALERT_COOLDOWN_SEC}s)."
    fi

    printf '%s\n' "fail" > "${STATE_FILE}"
    exit 1
  fi

  if [[ -f "${STATE_FILE}" ]] && [[ "$(cat "${STATE_FILE}" 2>/dev/null || true)" == "fail" ]] && [[ "${ALERT_SEND_RECOVERY}" == "1" ]]; then
    local recovery_file
    recovery_file="${TMP_DIR}/recovery.txt"
    {
      echo "Healthcheck recovered."
      echo "Local URL: ${LOCAL_APP_BASE_URL}"
      if [[ -n "${EXTERNAL_HEALTH_URL}" ]]; then
        echo "External URL: ${EXTERNAL_HEALTH_URL}"
      fi
    } > "${recovery_file}"
    "${NOTIFY_SCRIPT}" "recovery" "Healthcheck recovery" "${recovery_file}" || true
  fi

  printf '%s\n' "ok" > "${STATE_FILE}"
  log "All checks passed."
}

main "$@"
