#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/prosektorweb_dashboard}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DRY_RUN="${DRY_RUN:-0}"

log() {
  printf '[backup-prune] %s\n' "$*"
}

validate_inputs() {
  if ! [[ "${RETENTION_DAYS}" =~ ^[0-9]+$ ]]; then
    log "ERROR: RETENTION_DAYS must be a non-negative integer."
    exit 1
  fi

  case "${BACKUP_ROOT}" in
    ""|"/"|"/var"|"/var/backups")
      log "ERROR: BACKUP_ROOT is too broad or invalid: '${BACKUP_ROOT}'"
      exit 1
      ;;
  esac
}

main() {
  validate_inputs

  if [[ ! -d "${BACKUP_ROOT}" ]]; then
    log "No backup root found at ${BACKUP_ROOT}; nothing to prune."
    exit 0
  fi

  log "Scanning ${BACKUP_ROOT} for directories older than ${RETENTION_DAYS} day(s)..."
  mapfile -t old_dirs < <(find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" | sort)

  if [[ "${#old_dirs[@]}" -eq 0 ]]; then
    log "No old backup directories found."
    exit 0
  fi

  if [[ "${DRY_RUN}" == "1" ]]; then
    log "DRY_RUN=1 set. Directories that would be removed:"
    printf '%s\n' "${old_dirs[@]}"
    exit 0
  fi

  local dir
  for dir in "${old_dirs[@]}"; do
    log "Removing ${dir}"
    rm -rf "${dir}"
  done

  log "Prune complete. Removed ${#old_dirs[@]} director(y/ies)."
}

main "$@"
