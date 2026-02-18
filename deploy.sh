#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from main branch..."
git pull origin main

# Build and restart containers
echo "🏗️ Building and starting containers..."
docker compose build
docker compose up -d

echo "✅ Deployment complete!"
echo "📊 Current status:"
docker compose ps

echo "📝 Showing last 50 lines of logs..."
docker compose logs -f --tail=50
