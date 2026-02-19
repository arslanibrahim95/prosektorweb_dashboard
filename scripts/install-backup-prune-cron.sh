#!/usr/bin/env bash
set -euo pipefail

CRON_FILE="${CRON_FILE:-/etc/cron.d/prosektor-backup-prune}"
CRON_SCHEDULE="${CRON_SCHEDULE:-30 3 * * *}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/prosektorweb_dashboard}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
LOG_FILE="${LOG_FILE:-/var/log/prosektor-backup-prune.log}"
PRUNE_SCRIPT="${PRUNE_SCRIPT:-/var/www/prosektorweb_dashboard/scripts/prune-backups.sh}"

log() {
  printf '[backup-cron] %s\n' "$*"
}

main() {
  if [[ "${EUID}" -ne 0 ]]; then
    log "ERROR: Please run as root."
    exit 1
  fi

  if [[ ! -x "${PRUNE_SCRIPT}" ]]; then
    log "ERROR: prune script is missing or not executable: ${PRUNE_SCRIPT}"
    exit 1
  fi

  mkdir -p "$(dirname "${CRON_FILE}")"
  mkdir -p "$(dirname "${LOG_FILE}")"
  touch "${LOG_FILE}"

  cat > "${CRON_FILE}" <<EOF_CRON
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
${CRON_SCHEDULE} root BACKUP_ROOT='${BACKUP_ROOT}' RETENTION_DAYS='${RETENTION_DAYS}' '${PRUNE_SCRIPT}' >> '${LOG_FILE}' 2>&1
EOF_CRON

  chmod 644 "${CRON_FILE}"
  log "Installed cron file: ${CRON_FILE}"
  log "Schedule: ${CRON_SCHEDULE}"
  log "Retention: ${RETENTION_DAYS} day(s)"
  log "Backup root: ${BACKUP_ROOT}"
  log "Log file: ${LOG_FILE}"
}

main "$@"
