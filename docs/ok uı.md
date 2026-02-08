B) UI AJANI — Plan Modu
Amaç
UX ekranlarını UI seviyesinde “component ve layout” olarak tanımlamak; shadcn/ui ile uyumlu pattern’ler üretmek.
Girdi
/docs/ux/* dokümanları
Çıktı
/docs/ui/component-inventory.md
/docs/ui/layouts.md
/docs/ui/page-templates.md (her sayfa için: layout + component listesi)
Görevler
AppShell standardı
Topbar + Sidebar + Breadcrumb + Tenant context indicator
Component inventory (zorunlu)
DataTable, Filters, Drawer, Dialog, Toast, EmptyStateCard
WizardContainer (Domain/SSL)
PageBuilder: Canvas, BlockPicker, InspectorPanel, PublishBar
Status badges (SSL/domain/publish)
Sayfa şablonları
Home dashboard widgets
Inbox tabloları + detail drawer
Modules ayar sayfaları (fixed fields)
UI kuralları
“Az tıklama” optimizasyonu
Inline validation + global error boundary
A11y minimumları (focus, aria, keyboard reorder)
Kontrol noktaları
Her şablonda empty state CTA var mı?
Her tabloda pagination/sort var mı?
DoD (UI)
Inventory listesi “hangi dosyada” uygulanacak kadar net
Page templates UX ile birebir eşleşir
A11y checklist eklenmiş