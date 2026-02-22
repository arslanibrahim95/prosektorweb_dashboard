#!/bin/bash
set -e

# Setup paths
PROJECT_ROOT="$PWD"
DESKTOP_DIR="$(dirname "$PROJECT_ROOT")"
FRONTEND_REPO="$DESKTOP_DIR/prosektorweb_frontend"

echo "======================================"
echo "Repo Split: Frontend Extraction tool"
echo "======================================"

if [ -d "$FRONTEND_REPO" ]; then
    echo "Hata: $FRONTEND_REPO klasörü zaten mevcut!"
    exit 1
fi

echo ">> 1. Klonlama işlemi başlatılıyor..."
git clone "$PROJECT_ROOT" "$FRONTEND_REPO"
cd "$FRONTEND_REPO"

echo ">> 2. Backend paketleri siliniyor..."
# Backend dizinlerini git'ten (ve diskten) siliyoruz 
git rm -rf apps/api
git rm -rf packages/db
git rm -rf packages/contracts
git rm -rf packages/shared
git rm -rf packages/testing
git rm -f docker-compose.yml 

echo ">> 3. Next.js (apps/web) kök dizine taşınıyor..."
# pnpm monorepo yapısını bozup standart bir next.js projesine dönüştürüyoruz
git rm -f README.md package.json pnpm-workspace.yaml pnpm-lock.yaml
git rm -rf docs scripts .github
git mv apps/web/* .
git rm -rf apps

# web'in package.json'ı yeni projenin köküne geldi
echo ">> 4. Frontend repo ayarları güncelleniyor..."
# Burada paket adlarını güncelleyebilir veya workspace:* olanları silebiliriz
echo "DİKKAT: Bağımlılıkları (workspace:*) güncellemeyi unutmayın."

echo ">> 5. Değişiklikler commitleniyor..."
git commit -m "chore: extracted frontend application from monorepo"

echo "======================================"
echo "BİTTİ: Frontend reposu başarıyla oluşturuldu:"
echo "-> $FRONTEND_REPO"
echo "======================================"
echo "Lütfen yeni repoya gidip package.json bağımlılıklarını güncelleyin ve pnpm i çalıştırın."
