#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_BASE_URL="${APP_BASE_URL:-http://localhost:8080}"
HEALTH_RETRY_COUNT="${HEALTH_RETRY_COUNT:-20}"
HEALTH_RETRY_DELAY_SEC="${HEALTH_RETRY_DELAY_SEC:-2}"

log() {
  printf '[healthcheck] %s\n' "$*"
}

load_env_value() {
  local key="$1"
  local env_file="${ROOT_DIR}/.env"
  if [[ -f "${env_file}" ]]; then
    awk -F= -v k="${key}" '$1==k{print substr($0, index($0, "=")+1)}' "${env_file}" | head -n 1
  fi
}

is_expected_status() {
  local status="$1"
  shift
  local expected
  for expected in "$@"; do
    if [[ "${status}" == "${expected}" ]]; then
      return 0
    fi
  done
  return 1
}

check_endpoint() {
  local path="$1"
  shift
  local expected=("$@")
  local status
  local attempt=1
  local max_attempts="${HEALTH_RETRY_COUNT}"

  while [[ "${attempt}" -le "${max_attempts}" ]]; do
    status="$(curl -sS -o /tmp/prosektor_health_resp.tmp -w "%{http_code}" "${APP_BASE_URL}${path}" || echo "000")"
    if is_expected_status "${status}" "${expected[@]}"; then
      log "OK ${path} -> ${status}"
      return 0
    fi

    if [[ "${attempt}" -lt "${max_attempts}" ]]; then
      sleep "${HEALTH_RETRY_DELAY_SEC}"
    fi
    attempt=$((attempt + 1))
  done

  log "FAIL ${path} -> ${status} (expected: ${expected[*]}, attempts: ${max_attempts})"
  return 1
}

check_table() {
  local table="$1"
  local supabase_url="$2"
  local service_key="$3"
  local status
  local body_file="/tmp/prosektor_health_table_${table}.json"

  status="$(curl -sS -o "${body_file}" -w "%{http_code}" \
    "${supabase_url}/rest/v1/${table}?select=*&limit=1" \
    -H "apikey: ${service_key}" \
    -H "Authorization: Bearer ${service_key}")"

  if [[ "${status}" == "200" ]]; then
    log "OK table ${table} exists"
    return 0
  fi

  local msg
  msg="$(jq -r '.message // "unknown error"' "${body_file}" 2>/dev/null || echo "unknown error")"
  log "FAIL table ${table} missing/unhealthy -> ${status} (${msg})"
  return 1
}

main() {
  local failed=0

  log "Base URL: ${APP_BASE_URL}"

  # Public/SSR surface should never return 404/500 for these.
  check_endpoint "/admin/logs" 200 || failed=$((failed + 1))

  # Auth-only API endpoints should typically return 401 when unauthenticated.
  check_endpoint "/api/admin/content/pages?page=1&limit=20" 200 401 403 || failed=$((failed + 1))
  check_endpoint "/api/admin/cache" 200 401 403 || failed=$((failed + 1))
  check_endpoint "/api/admin/logs?page=1&limit=20" 200 401 403 || failed=$((failed + 1))

  local supabase_url="${SUPABASE_URL:-$(load_env_value SUPABASE_URL)}"
  local service_key="${SUPABASE_SERVICE_ROLE_KEY:-$(load_env_value SUPABASE_SERVICE_ROLE_KEY)}"

  if [[ -z "${supabase_url}" || -z "${service_key}" ]]; then
    log "WARN: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing; skipping DB table checks."
  else
    local tables=(
      "platform_settings"
      "platform_audit_logs"
      "component_library"
      "page_layouts"
      "layout_history"
      "ab_tests"
      "ab_test_metrics"
    )
    local t
    for t in "${tables[@]}"; do
      check_table "${t}" "${supabase_url}" "${service_key}" || failed=$((failed + 1))
    done
  fi

  if [[ "${failed}" -gt 0 ]]; then
    log "Completed with ${failed} failure(s)."
    exit 1
  fi

  log "All critical checks passed."
}

main "$@"
