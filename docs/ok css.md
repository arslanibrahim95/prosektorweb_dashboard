C) CSS / DESIGN SYSTEM AJANI — Plan Modu
Amaç
Tailwind token’ları, tema, spacing/radius/typography standardı; shadcn/ui override stratejisi.
Girdi
UI ajanının component inventory + layout kuralları
Çıktı
/packages/design-tokens/tailwind.config.ts
/packages/design-tokens/tokens.css
/apps/web/styles/globals.css
/docs/ui/design-system.md
Görevler
Token seti oluştur
colors, radii, spacing, font sizes, shadows
Theme (light/dark)
MVP’de dark opsiyonel; ama altyapı hazır
shadcn/ui uyumluluğu
className patterns, variants standardı
Responsive breakpoints
Builder canvas + inspector davranışı net
Kontrol noktaları
Görsel tutarlılık: DataTable/Drawer/Dialog aynı spacing
“danger/primary/secondary” buton kontrastı
DoD (CSS/DS)
Token’lar tek yerden yönetiliyor
UI ajanı component’leri bu token’ları kullanacak biçimde tarif edilmiş
A11y kontrast riski not edilmiş