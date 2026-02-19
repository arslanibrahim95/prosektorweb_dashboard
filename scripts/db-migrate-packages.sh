#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT_DIR}/packages/db/migrations"

TARGET_MIGRATIONS=(
  "0009_platform_settings.sql"
  "0010_platform_audit.sql"
  "0011_builder_components.sql"
  "0012_builder_rls.sql"
  "0014_ab_testing.sql"
  "0015_pages_origin.sql"
)

log() {
  printf '[db-migrate] %s\n' "$*"
}

load_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return 0
  fi

  local env_file="${ROOT_DIR}/.env"
  if [[ -f "${env_file}" ]]; then
    DATABASE_URL="$(awk -F= '$1=="DATABASE_URL"{print substr($0, index($0, "=")+1)}' "${env_file}" | head -n 1)"
    export DATABASE_URL
  fi

  if [[ -z "${DATABASE_URL:-}" ]]; then
    log "ERROR: DATABASE_URL is not set (env or .env)."
    exit 1
  fi
}

PSQL_MODE=""
PSQL_EXEC_CONTAINER=""

init_psql_mode() {
  if command -v psql >/dev/null 2>&1; then
    PSQL_MODE="native"
    log "Using native psql client."
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    local container_name
    if command -v rg >/dev/null 2>&1; then
      container_name="$(docker ps --format '{{.Names}}' | rg '^supabase_db_prosektorweb_dashboard$' || true)"
    else
      container_name="$(docker ps --format '{{.Names}}' | grep -E '^supabase_db_prosektorweb_dashboard$' || true)"
    fi
    if [[ -n "${container_name}" ]]; then
      PSQL_MODE="docker_exec"
      PSQL_EXEC_CONTAINER="${container_name}"
      log "Using psql via container: ${PSQL_EXEC_CONTAINER}."
      return
    fi

    PSQL_MODE="docker_run"
    log "Using ephemeral postgres client via docker run."
    return
  fi

  log "ERROR: Neither psql nor docker is available."
  exit 1
}

psql_query() {
  local sql="$1"
  case "${PSQL_MODE}" in
    native)
      psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -tA -c "${sql}"
      ;;
    docker_exec)
      docker exec -i "${PSQL_EXEC_CONTAINER}" psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -tA -c "${sql}"
      ;;
    docker_run)
      docker run --rm -i postgres:17-alpine psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -tA -c "${sql}"
      ;;
    *)
      log "ERROR: Unknown PSQL_MODE=${PSQL_MODE}"
      exit 1
      ;;
  esac
}

psql_file() {
  local file="$1"
  case "${PSQL_MODE}" in
    native)
      psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -f "${file}" >/dev/null
      ;;
    docker_exec)
      docker exec -i "${PSQL_EXEC_CONTAINER}" psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 < "${file}" >/dev/null
      ;;
    docker_run)
      docker run --rm -i postgres:17-alpine psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 < "${file}" >/dev/null
      ;;
    *)
      log "ERROR: Unknown PSQL_MODE=${PSQL_MODE}"
      exit 1
      ;;
  esac
}

file_checksum() {
  local file="$1"
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${file}" | awk '{print $1}'
  else
    sha256sum "${file}" | awk '{print $1}'
  fi
}

ensure_tracker_table() {
  psql_query "
    CREATE TABLE IF NOT EXISTS public.prosektor_migrations (
      version TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('executed', 'detected')),
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  " >/dev/null
}

is_recorded() {
  local version="$1"
  local exists
  exists="$(psql_query "SELECT 1 FROM public.prosektor_migrations WHERE version = '${version}' LIMIT 1;")"
  [[ "${exists}" == "1" ]]
}

record_version() {
  local version="$1"
  local checksum="$2"
  local source="$3"
  psql_query "
    INSERT INTO public.prosektor_migrations(version, checksum, source)
    VALUES ('${version}', '${checksum}', '${source}')
    ON CONFLICT (version) DO UPDATE
      SET checksum = EXCLUDED.checksum,
          source = EXCLUDED.source,
          applied_at = now();
  " >/dev/null
}

schema_has_version() {
  local version="$1"
  local sql=""
  case "${version}" in
    0009_platform_settings)
      sql="SELECT CASE WHEN to_regclass('public.platform_settings') IS NOT NULL THEN 1 ELSE 0 END;"
      ;;
    0010_platform_audit)
      sql="SELECT CASE WHEN to_regclass('public.platform_audit_logs') IS NOT NULL THEN 1 ELSE 0 END;"
      ;;
    0011_builder_components)
      sql="SELECT CASE WHEN to_regclass('public.component_library') IS NOT NULL AND to_regclass('public.page_layouts') IS NOT NULL AND to_regclass('public.layout_history') IS NOT NULL THEN 1 ELSE 0 END;"
      ;;
    0012_builder_rls)
      sql="SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='page_layouts' AND policyname='page_layouts_select') THEN 1 ELSE 0 END;"
      ;;
    0014_ab_testing)
      sql="SELECT CASE WHEN to_regclass('public.ab_tests') IS NOT NULL AND to_regclass('public.ab_test_metrics') IS NOT NULL THEN 1 ELSE 0 END;"
      ;;
    0015_pages_origin)
      sql="SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pages' AND column_name='origin') THEN 1 ELSE 0 END;"
      ;;
    *)
      return 1
      ;;
  esac

  local result
  result="$(psql_query "${sql}")"
  [[ "${result}" == "1" ]]
}

main() {
  load_database_url
  init_psql_mode
  ensure_tracker_table

  for file_name in "${TARGET_MIGRATIONS[@]}"; do
    local_path="${MIGRATIONS_DIR}/${file_name}"
    version="${file_name%.sql}"

    if [[ ! -f "${local_path}" ]]; then
      log "ERROR: Missing migration file ${local_path}"
      exit 1
    fi

    checksum="$(file_checksum "${local_path}")"

    if is_recorded "${version}"; then
      log "Skip ${version} (already recorded)."
      continue
    fi

    if schema_has_version "${version}"; then
      record_version "${version}" "${checksum}" "detected"
      log "Mark ${version} as detected (schema already present)."
      continue
    fi

    log "Apply ${version}..."
    psql_file "${local_path}"
    record_version "${version}" "${checksum}" "executed"
    log "Applied ${version}."
  done

  log "All targeted package DB migrations are up to date."
}

main "$@"
