#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting deployment..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
APP_BASE_URL="${APP_BASE_URL:-http://localhost:8080}"
ALLOW_DIRTY_DEPLOY="${ALLOW_DIRTY_DEPLOY:-0}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Missing required command: $1"
    exit 1
  fi
}

ensure_clean_git_tree() {
  local dirty=0

  git update-index -q --refresh || true
  if ! git diff --quiet || ! git diff --cached --quiet; then
    dirty=1
  fi
  if [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    dirty=1
  fi

  if [[ "${dirty}" -eq 1 ]]; then
    if [[ "${ALLOW_DIRTY_DEPLOY}" == "1" ]]; then
      echo "⚠️  Git worktree is dirty but ALLOW_DIRTY_DEPLOY=1; continuing."
      return 0
    fi

    echo "❌ Git worktree has uncommitted/untracked changes. Refusing deploy."
    echo "   Set ALLOW_DIRTY_DEPLOY=1 only if you intentionally want to deploy from a dirty tree."
    git status --short
    exit 1
  fi
}

require_cmd git
require_cmd docker
if ! docker compose version >/dev/null 2>&1; then
  echo "❌ docker compose is not available."
  exit 1
fi

ensure_clean_git_tree

# Sync to remote branch deterministically (no merge commits during deploy).
echo "📥 Syncing latest changes from origin/${DEPLOY_BRANCH}..."
git fetch origin "${DEPLOY_BRANCH}"
git checkout "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

# Run DB migrations that live outside supabase/migrations
echo "🗃️ Applying package DB migrations..."
"${SCRIPT_DIR}/scripts/db-migrate-packages.sh"

# Build and restart containers
echo "🏗️ Building and starting containers..."
docker compose build
docker compose up -d

echo "🩺 Running critical health checks..."
APP_BASE_URL="${APP_BASE_URL}" "${SCRIPT_DIR}/scripts/healthcheck-critical.sh"

echo "✅ Deployment complete!"
echo "📊 Current status:"
docker compose ps

echo "📝 Showing last 50 lines of logs..."
docker compose logs --tail=50
