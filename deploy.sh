#!/bin/bash
set -e

echo "🚀 Starting deployment..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pull latest changes
echo "📥 Pulling latest changes from main branch..."
git pull origin main

# Run DB migrations that live outside supabase/migrations
echo "🗃️ Applying package DB migrations..."
"${SCRIPT_DIR}/scripts/db-migrate-packages.sh"

# Build and restart containers
echo "🏗️ Building and starting containers..."
docker compose build
docker compose up -d

echo "🩺 Running critical health checks..."
APP_BASE_URL="${APP_BASE_URL:-http://localhost:8080}" "${SCRIPT_DIR}/scripts/healthcheck-critical.sh"

echo "✅ Deployment complete!"
echo "📊 Current status:"
docker compose ps

echo "📝 Showing last 50 lines of logs..."
docker compose logs --tail=50
