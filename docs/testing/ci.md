# CI Testing Pipeline

> **Version:** 1.0.0 | **Son Güncelleme:** 2026-02-23

ProsektorWeb CI/CD süreçleri için test otomasyon stratejisi.

---

## İş Akışı (Workflow)

Pipeline iki ana aşamadan oluşur:

### 1. Pull Request (PR) Aşaması
Her PR açıldığında veya güncellendiğinde çalışan hızlı testler.

- **Trigger:** `pull_request`
- **Görevler:**
  - `pnpm run validate:agents-team`: Agent konfigürasyon ve pipeline tutarlılığı
  - `pnpm lint`: Statik analiz
  - `pnpm test:contracts`: Schema uyumluluğu
  - `pnpm test:api`: Route handler testleri
  - `pnpm test:db`: RLS izolasyon testleri
- **Hedef:** Kod kalitesini korumak ve tenant sızıntılarını önlemek.

### 2. Main Merge (Post-Merge) Aşaması
Main branch'e merge sonrası veya release öncesi çalışan kapsamlı testler.

- **Trigger:** `push` to `main`
- **Görevler:**
  - `pnpm test:e2e`: Playwright uçtan uca senaryolar
- **Hedef:** Kritik kullanıcı akışlarının (HR, Offer, Contact) bozulmadığından emin olmak.

---

## GitHub Actions Örneği

```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  fast-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Start Supabase (Docker)
        run: |
          npm install -g supabase
          supabase start

      - name: Run Fast Tests
        run: |
          pnpm run validate:agents-team
          pnpm lint
          pnpm test:contracts
          pnpm test:api
          pnpm test:db

  e2e-tests:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: fast-tests
    steps:
      - uses: actions/checkout@v4
      - name: Run Playwright
        run: |
          pnpm install
          npx playwright install --with-deps
          pnpm test:e2e
```

---

## Başarı Kriterleri (DoD)

- [ ] Tüm P0 testleri geçmeli.
- [ ] Test coverage %80'in altına düşmemeli (P1 dahil).
- [ ] DB/RLS testleri gerçek Supabase ortamında (local docker) koşmalı.
- [ ] E2E testleri gerçek browser (headless) ile doğrulanmalı.
