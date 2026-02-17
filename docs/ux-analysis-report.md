# ProsektorWeb Dashboard - Kapsamli UX Analiz Raporu

**Tarih:** 2026-02-16
**Analiz Ekibi:** Gemini (Yapisal), Claude Explore x2 (Component + Akis), Claude (Koordinasyon)
**Kapsam:** 10 UX Kriteri, 133+ TypeScript/React dosya taranmistir

---

## OZET SKOR TABLOSU

| # | Kriter | Skor | Tespit Sayisi |
|---|--------|------|---------------|
| 1 | Navigasyon & Bilgi Mimarisi | 6/10 | 4 sorun |
| 2 | Erisilebilirlik | 4/10 | 5 sorun |
| 3 | Mobil Uyumluluk | 5/10 | 4 sorun |
| 4 | Kullanici Akislari | 6/10 | 5 sorun |
| 5 | Gorsel Hiyerarsi | 7/10 | 3 sorun |
| 6 | Etkilesim & Geri Bildirim | 5/10 | 5 sorun |
| 7 | Performans | 4/10 | 7 sorun |
| 8 | Form Tasarimi | 6/10 | 4 sorun |
| 9 | Hata Yonetimi | 5/10 | 5 sorun |
| 10 | Tutarlilik | 6/10 | 4 sorun |
| | **GENEL ORTALAMA** | **5.4/10** | **46 sorun** |

---

## 1. NAVIGASYON VE BILGI MIMARISI TUTARLILIGI

### 1.1 Sidebar Gruplama Eksikligi
- **SORUN:** 14+ menu ogesi duz liste halinde, kategorilere ayrilmamis. Kullanicilar "Guvenlik" ile "Tema" arasindaki mantiksal farki goremez.
- **ETKI:** Bilissel yuk (cognitive load) artar. Hedef sayfaya ulasma suresi uzar. Yeni kullanicilar kaybolur.
- **ONCELIK:** Orta
- **COZUM:** `adminNavItems` listesini "Sistem" (Guvenlik, Cache, Yedekleme), "Icerik" (Icerik, Raporlar), "Ayarlar" (Tema, i18n, Bildirimler) gibi gruplara ayir. `SidebarSeparator` veya collapsible grup basliklari kullan.
- **DOSYA:** `apps/web/src/features/admin/components/admin-sidebar.tsx`

### 1.2 AdminPageHeader Tutarsiz Kullanimi
- **SORUN:** Bazi sayfalar `AdminPageHeader` componentini kullaniyor, bazilari manuel flex-box yapilari kullanmis. Sayfa basliklari arasinda padding/spacing farkliliklari var.
- **ETKI:** Gorsel tutarsizlik. Kullanicinin "neredeyim" hissi zayiflar.
- **ONCELIK:** Dusuk
- **COZUM:** Tum admin sayfalarini `AdminPageHeader` componentini kullanacak sekilde refactor et.
- **DOSYA:** `apps/web/src/app/(dashboard)/admin/users/page.tsx` (eksik), diger sayfalar (mevcut)

### 1.3 API Routing Karisikligi
- **SORUN:** `/admin/api` sayfasi dogrudan `/admin/api-keys`'e redirect ediyor. Kullanici URL'den ne bekledigi ile ne gördügü arasindan fark var.
- **ETKI:** Kullanici bookmark veya paylasim yaparken yanlis sayfaya ulasir.
- **ONCELIK:** Dusuk
- **COZUM:** Ya redirect'i kaldir ve `/admin/api` hub sayfasi yap, ya da sidebar'dan dogrudan `/admin/api-keys`'e link ver.
- **DOSYA:** `apps/web/src/app/(dashboard)/admin/api/page.tsx`

### 1.4 Breadcrumb Entegrasyonu Yetersiz
- **SORUN:** Breadcrumb componenti mevcut ama tum admin sayfalarina entegre edilmemis. Derinlik hissi kayip.
- **ETKI:** Kullanici sayfa hiyerarsisinde nerede oldugunu anlayamaz. Geri donme icin sidebar'a bakmak zorunda kalir.
- **ONCELIK:** Orta
- **COZUM:** `AppShell` veya `AdminPageHeader` icerisine otomatik breadcrumb ekle (route-based).
- **DOSYA:** `apps/web/src/components/ui/breadcrumbs.tsx`

---

## 2. ERISILEBILIRLIK STANDARTLARINA UYUM

### 2.1 Sidebar Toggle aria-label Eksik
- **SORUN:** Sidebar'i daraltan/genisleten butonun `aria-label` attribute'u yok. Screen reader kullanicilari butonun islevini anlayamaz.
- **ETKI:** WCAG 2.1 AA ihlali. Engelli kullanicilar navigasyonu kullanamaz.
- **ONCELIK:** **Kritik**
- **COZUM:** `aria-label={collapsed ? "Menuyu genislet" : "Menuyu daralt"}` ekle.
- **DOSYA:** `apps/web/src/features/admin/components/admin-sidebar.tsx`

### 2.2 Tablo Erisilebilirlik Eksiklikleri
- **SORUN:** Veri tablolarinda `<caption>` veya `TableCaption` kullanilmamis. Tablolarin amaci programatik olarak belirlenemez.
- **ETKI:** Screen reader kullanicilari tablonun icerigini hizla anlayamaz.
- **ONCELIK:** Orta
- **COZUM:** Her tabloya icerigini ozetleyen gizli veya gorunur bir `TableCaption` ekle.
- **DOSYA:** `apps/web/src/app/(dashboard)/admin/users/page.tsx`, diger tablo sayfalar

### 2.3 Renk Kontrasti Belirsizligi
- **SORUN:** OKLCH renk sistemi kullaniliyor ancak contrast ratio hesaplamasi yapilmamis. `text-muted-foreground` ile `bg-card` arasindaki kontrast WCAG AA (4.5:1) saglaniyor mu bilinmiyor.
- **ETKI:** Dusuk goruslu kullanicilar metinleri okuyamayabilir.
- **ONCELIK:** Yuksek
- **COZUM:** Design token'lardaki tum renk ciftleri icin contrast ratio testi yap. Lighthouse a11y audit calistir.
- **DOSYA:** `packages/design-tokens/tokens.css`

### 2.4 Klavye Navigasyonu Eksiklikleri
- **SORUN:** Custom interactive elementlerde (quick action cards, activity list items) `tabIndex` ve `onKeyDown` handler eksik. Enter/Space ile aktive edilemiyor.
- **ETKI:** Sadece klavye kullanan kullanicilar bu elementlere erisemez.
- **ONCELIK:** Yuksek
- **COZUM:** Interaktif `<div>` ve `<span>` elementlerini `<button>` veya `<Link>` ile degistir. Custom handler gerekiyorsa `role="button" tabIndex={0}` ekle.
- **DOSYA:** `apps/web/src/app/(dashboard)/home/page.tsx` (activity items)

### 2.5 Focus Yonetimi Eksik
- **SORUN:** Modal/dialog acildiginda focus trap uygulanmis (Radix UI), ancak sayfa gecislerinde focus reset yapilmiyor.
- **ETKI:** Klavye kullanicilari sayfa degistiginde focus'un nerede oldugunu kaybeder.
- **ONCELIK:** Orta
- **COZUM:** Route degisiminde `document.getElementById('main-content')?.focus()` veya Next.js built-in focus management kulllan.

---

## 3. MOBIL UYUMLULUK VE DUYARLI TASARIM

### 3.1 Sidebar Mobile Davranisi Belirsiz
- **SORUN:** Sidebar collapse davranisi var ama tam mobile hamburger menu pattern'i eksik. Kucuk ekranlarda sidebar overlay olarak acilmiyor.
- **ETKI:** Mobil kullanicilar sidebar'a erismekte zorluk ceker. Ekranin buyuk kismini kapatabilir.
- **ONCELIK:** Yuksek
- **COZUM:** `md:` breakpoint altinda sidebar'i `Sheet` (slide-over) componentine cevir. Hamburger menu ikonu ekle.
- **DOSYA:** `apps/web/src/app/(dashboard)/layout.tsx`, `admin-sidebar.tsx`

### 3.2 Tablo Responsive Eksikligi
- **SORUN:** Admin tablolari (users, logs, security) responsive degil. Dar ekranlarda yatay scroll yok veya column onceliklendirmesi yapilmamis.
- **ETKI:** Mobil kullanicilar tablo verilerini goremez veya cok scroll yapmak zorunda kalir.
- **ONCELIK:** Yuksek
- **COZUM:** Tablo wrapper'a `overflow-x-auto` ekle. Onceliksiz kolonlari `hidden md:table-cell` ile gizle. Veya kart gorunumune gecis secenegi sun.
- **DOSYA:** Tum admin sayfalari

### 3.3 Form Layout Mobil Uyumsuzluk
- **SORUN:** Admin ayar formlari (theme, security, cache) grid layout kullanyor ama mobil breakpoint'leri eksik.
- **ETKI:** Formlar mobilde yanyana cikip okunamaz hale gelir.
- **ONCELIK:** Orta
- **COZUM:** `grid-cols-2` kullanan yerlerde `grid-cols-1 md:grid-cols-2` pattern'ini uygula.
- **DOSYA:** Admin sayfalari genel

### 3.4 Touch Target Boyutlari
- **SORUN:** Bazi buton ve link'ler minimum 44x44px touch target boyutuna ulasamiyor (ozellikle dropdown menu trigger'lari ve kucuk icon button'lar).
- **ETKI:** Mobil kullanicilar yanlis elemente basar.
- **ONCELIK:** Orta
- **COZUM:** Tum interaktif elementlerin min `h-11 w-11` (44px) olmasini sagla. Icon button'lara padding ekle.

---

## 4. KULLANICI AKISLARI VE ISLEM SURECI ETKINLIGI

### 4.1 Onboarding Akisi Cok Sade
- **SORUN:** Onboarding sadece 1 adim: organizasyon adi gir. Welcome modal 4 slayt gosteriyor ama bunlar bilgilendirici, eyleme yonlendirici degil.
- **ETKI:** Kullanici ilk giris sonrasi ne yapacagini bilemez. Activation rate duser.
- **ONCELIK:** Yuksek
- **COZUM:** Multi-step wizard: 1) Org olustur 2) Profil tamamla 3) Ilk modulu kur 4) Domain ekle. Her adimda ilerleme gostergesi.
- **DOSYA:** `apps/web/src/app/(dashboard)/onboarding/page.tsx`, `components/onboarding/welcome-modal.tsx`

### 4.2 Dashboard Checklist Statik
- **SORUN:** Ana sayfadaki "Kurulum Checklist" (5 madde) sadece `currentSite?.status`'a bakiyor. Diger maddeler her zaman "tamamlanmadi" gosteriyor.
- **ETKI:** Kullanici ilerleme hissi yasamaz. Motivasyon duser.
- **ONCELIK:** Orta
- **COZUM:** Her checklist item'ini gercek veri kaynagiyla (modules API, domains API) baglanti kur. Tamamlaninca animasyon goster.
- **DOSYA:** `apps/web/src/app/(dashboard)/home/page.tsx:168-176`

### 4.3 Admin Panel Daginilik
- **SORUN:** 14 admin alt sayfasi arasinda mantiksal gruplama yok. Guvenlik ayarlari icin 3 ayri sekme (sessions, 2FA, IP blocking) var ama bunlar tek sayfada.
- **ETKI:** Yonetici is akisi verimsiz. Sik kullanilan ayarlara hizli erisim yok.
- **ONCELIK:** Yuksek
- **COZUM:** Admin hub sayfasini "hizli erisim kartlari" ile donatin. En sik kullanilan islemleri one cikar.
- **DOSYA:** `apps/web/src/app/(dashboard)/admin/page.tsx`

### 4.4 Inbox Okuma Akisi
- **SORUN:** Mesaj okumak icin: liste gör → tiklama → drawer acilir. Onceki/sonraki mesaja gecis yok.
- **ETKI:** Cok mesaj okurken verimsiz. Her seferinde drawer'i kapatip yenisini acmak gerekiyor.
- **ONCELIK:** Orta
- **COZUM:** Drawer icerisine onceki/sonraki ok butonlari ekle. Veya split-view layout'a gec (sol liste, sag detay).

### 4.5 console.log Production'da
- **SORUN:** `HomePage` componenti `console.log('Rendering HomePage', ...)` iceriyor. Development artifact'i.
- **ETKI:** Production console'u kirlenir. Hassas bilgi (email, tenant slug) aciga cikar.
- **ONCELIK:** Yuksek
- **COZUM:** Kaldir veya `if (process.env.NODE_ENV === 'development')` kontrolu ekle.
- **DOSYA:** `apps/web/src/app/(dashboard)/home/page.tsx:102`

---

## 5. GORSEL HIYERARSI VE OKUNABILIRLIK

### 5.1 Collapsed Sidebar Ikon Cakismasi
- **SORUN:** "Icerik Yonetimi" ve "Raporlar" ayni ikonu (FileText) kullaniyor. Sidebar daraltildiginda ayirt edilemiyor.
- **ETKI:** Kullanicilar yanlis sayfaya gider.
- **ONCELIK:** Orta
- **COZUM:** Her menu ogesi icin benzersiz Lucide ikonu sec (Raporlar icin `FileBarChart`, Icerik icin `Newspaper`).
- **DOSYA:** `apps/web/src/features/admin/components/admin-sidebar.tsx`

### 5.2 Bos Durum Tasarimi Yetersiz
- **SORUN:** Arama sonucu bosken sadece metin ("Kullanici bulunamadi.") gosteriliyor. Illustrasyon, rehberlik veya alternatif eylem yok.
- **ETKI:** Kullanici cikmaza girer, sonraki adimi bilemez.
- **ONCELIK:** Orta
- **COZUM:** `EmptyState` componenti olustur: illustrasyon + baslik + aciklama + CTA butonu. Inbox'taki iyi ornegi genellelestir.
- **DOSYA:** Admin sayfalari geneli

### 5.3 Stat Card Gorsel Agirligi
- **SORUN:** Dashboard stat kartlarinda gradient overlay + border-left + icon gradient + shadow + hover scale birlikte kullaniliyor. Gorsel gurultu olusturuyor.
- **ETKI:** Onemli bilgi (sayi) gorsel karmasiklikta kaybolur.
- **ONCELIK:** Dusuk
- **COZUM:** Gorsel efektleri sadelelestir. Ya gradient ya border-left kullan, ikisini birden degil.
- **DOSYA:** `apps/web/src/app/(dashboard)/home/page.tsx:280-316`

---

## 6. ETKILESIM OGELERI VE GERI BILDIRIM

### 6.1 Native confirm() Kullanimi
- **SORUN:** Kullanici silme isleminde tarayici native `confirm()` dialog'u kullaniliyor. Projede Radix `AlertDialog` mevcut ama kullanilmamis.
- **ETKI:** Modern UI deneyimi kirilir. Stil tutarsizligi. Mobile'da kotu gorunur.
- **ONCELIK:** **Kritik**
- **COZUM:** Tum `confirm()` cagirillarini projedeki `AlertDialog` componenti ile degistir.
- **DOSYA:** `apps/web/src/app/(dashboard)/admin/users/page.tsx`

### 6.2 Loading State Tutarsizligi
- **SORUN:** Bazi sayfalarda Skeleton loader var (home), bazillarinda "Yukleniyor..." metni (admin sayfalar), bazillarinda hicbir sey yok.
- **ETKI:** Kullanici bekleme suresinde ne oldugunu anlayamaz veya sayfanin bozuldugunu dusunur.
- **ONCELIK:** Yuksek
- **COZUM:** Tum sayfalar icin tutarli skeleton pattern olustur. `loading.tsx` dosyalarini tum route'lara ekle.
- **DOSYA:** Sadece 3 loading.tsx var: `/dashboard/`, `/dashboard/home/`, `/dashboard/inbox/`

### 6.3 Buton Loading State Eksik
- **SORUN:** Form submit butonlarinda loading spinner/disabled state tutarsiz. Bazi butonlar "Kaydediliyor..." gosteriyor, bazilari degismiyor.
- **ETKI:** Kullanici birden fazla tiklama yapar, duplicate request olusur.
- **ONCELIK:** Yuksek
- **COZUM:** Tum form submit butonlarina `disabled={isPending}` ve spinner/loading text ekle.

### 6.4 Optimistic Update Eksikligi
- **SORUN:** Inbox'ta "okundu isaretle" ve bulk aksiyonlar API cevabini bekleyerek, aninda gorsel degisiklik yok.
- **ETKI:** Kullanici isllemin basarilip basaramadigini anlamak icin beklemek zorunda. Algillanan performans duser.
- **ONCELIK:** Orta
- **COZUM:** React Query `onMutate` ile optimistic update: UI'i hemen guncelle, hata olursa rollback yap.

### 6.5 Toast Mesaj Tutarsizligi
- **SORUN:** 77 toast kullanimi var ama mesaj formati tutarsiz. Bazen "basarili", bazen "kaydedildi", bazen "olusturuldu".
- **ETKI:** Kullanici farkli sayfallarda farkli geri bildirim tonu alir. Profesyonellik algisi duser.
- **ONCELIK:** Dusuk
- **COZUM:** Toast mesajlarini i18n key'leri uzerinden standartlastir (Gorev 5'te eklenen `admin` namespace).

---

## 7. YUKLENME SURELERI VE PERFORMANS

### 7.1 Asiri 'use client' Kullanimi
- **SORUN:** 82 dosyada `'use client'` var (%62). Tum sayfa componentleri client-side. SSR avantaji kaybedilmis.
- **ETKI:** TTFB artar, ilk yukleme suresi uzar, SEO etkilenir, kullanici beyaz ekran gorur.
- **ONCELIK:** **Kritik**
- **COZUM:** Sayfa layout'larini server component olarak tut. Sadece interaktif kisimları (formlar, butonlar) client component yap. Data fetching'i server'a tasi.
- **TAHMINI KAZANIM:** TTFB %20-30 iyilesme

### 7.2 React Suspense Kullanilmiyor
- **SORUN:** Hicbir yerde `<Suspense>` boundary yok. Agir componentler icin progressive loading mumkun degil.
- **ETKI:** Sayfa "ya tamamen yuklu ya da bos" durumunda. Parcali yuklenme yok.
- **ONCELIK:** Yuksek
- **COZUM:** Data-intensive componentleri `Suspense` boundary ile sar. Fallback olarak skeleton goster.

### 7.3 Dynamic Import Eksikligi
- **SORUN:** Builder component kutuphanesi ve admin sayfallari eagerly yukleniyor. `next/dynamic` kullanilmamis.
- **ETKI:** Initial bundle buyuk, ilk sayfa yuklenme suresi etkilenir.
- **ONCELIK:** Yuksek
- **COZUM:** `const BuilderCanvas = dynamic(() => import('./BuilderCanvas'), { ssr: false })` pattern'ini uygula. Admin sayfalarindaki agir componentleri lazy load et.
- **TAHMINI KAZANIM:** Bundle size %10-15 azalma

### 7.4 next/image Kullanilmiyor
- **SORUN:** Builder component'lerinde native `<img>` tag'i kullaniliyor. next/image optimizasyonu yok.
- **ETKI:** Gorsel optimizasyonu yok. Buyuk resimler yavas yuklenir, CLS sorunu olusur.
- **ONCELIK:** Orta
- **COZUM:** Tum `<img>` tag'lerini `next/image` ile degistir. `placeholder="blur"` ve responsive `sizes` ekle.
- **DOSYA:** `apps/web/src/features/builder/components/PropertiesPanel.tsx`

### 7.5 useMemo/useCallback Eksikligi
- **SORUN:** Ozellikle inbox sayfalarinda column definitions her render'da yeniden olusturuluyor.
- **ETKI:** Gereksiz re-render'lar, buyuk listelerde performans dususu.
- **ONCELIK:** Orta
- **COZUM:** Tablo column defs'i ve filter callback'lerini `useMemo`/`useCallback` ile wrap et.
- **DOSYA:** `apps/web/src/app/(dashboard)/inbox/contact/page.tsx`

### 7.6 Loading.tsx Kapsam Eksikligi
- **SORUN:** Sadece 3 route'ta `loading.tsx` var. Admin (14 sayfa), settings, modules route'larinda yok.
- **ETKI:** Next.js Suspense boundary calismaz, sayfa gecisileri anllik "bos ekran" gosterir.
- **ONCELIK:** Orta
- **COZUM:** Her ust-seviye route grubu icin `loading.tsx` ekle (admin, settings, modules, site).

### 7.7 React Query Stale Time Optimizasyonu
- **SORUN:** Inbox ve dashboard hook'larinda `staleTime` default (0). Her focus'ta refetch yapiyor.
- **ETKI:** Gereksiz API cagirilari, sunucu yuku.
- **ONCELIK:** Dusuk
- **COZUM:** Dashboard icin `staleTime: 30_000` (30s), inbox icin `staleTime: 10_000` (10s) ayarla.

---

## 8. FORM TASARIMLARI VE VERI GIRISI

### 8.1 react-hook-form Kullanilmiyor
- **SORUN:** Formlar `useState` ile yonetiliyor. Merkezi validation, dirty state tracking, field-level error yok.
- **ETKI:** Form deneyimi tutarsiz. Validation hatalari generic. Karmasik formlarda state yonetimi zorlasir.
- **ONCELIK:** Yuksek
- **COZUM:** `react-hook-form` + `zod` resolver entegrasyonu yap. Ozellikle admin ayar formlarina oncelik ver.
- **DOSYA:** Admin security, theme, cache, notification sayfalari

### 8.2 Inline Validation Eksik
- **SORUN:** Form hatalari submit sonrasi toast ile gosteriliyor. Alan bazli inline hata mesaji yok.
- **ETKI:** Kullanici hangi alanin hatali oldugunu anlamak icin toast mesajini okumalki.
- **ONCELIK:** Yuksek
- **COZUM:** Her form alani altina `FormMessage` componenti ekle. Hatayi yaninda goster (kirmizi border + hata metni).

### 8.3 Autofocus Tutarsiz
- **SORUN:** Bazi dialoglarda (kullanici davet) ilk alana autofocus var, bazillarinda yok.
- **ETKI:** Kullanici her seferinde ilk alana tikllamak zorunda kalir.
- **ONCELIK:** Dusuk
- **COZUM:** Tum dialog ve modal formllarinda ilk input alanina `autoFocus` ekle.

### 8.4 Multi-step Form Eksik
- **SORUN:** Karmasik ayar sayfalari (security: 3 tab, theme: 4 section) tek uzun sayfada. Wizard/stepper patterni yok.
- **ETKI:** Kullanici uzun sayfada kaybolur. "Nereye kadar doldurdum" hissi yok.
- **ONCELIK:** Orta
- **COZUM:** Uzun ayar sayfalarini tab-based wizard'a cevir. Her tab'da save butonu ve ilerleme gostergesi.

---

## 9. HATA YONETIMI VE YARDIM ICERIKLERI

### 9.1 Error Boundary Bilgilendirme Eksik
- **SORUN:** Error boundary "Bir seyler yanlis gitti" generic mesaji veriyor. Hata kodu, retry secenegi ve destek iletisimi yok.
- **ETKI:** Kullanici ne yapacagini bilemez. Destek ekibine bilgi veremez.
- **ONCELIK:** **Kritik**
- **COZUM:** Error boundary'e: 1) Hata kodu/referans ID 2) "Tekrar Dene" butonu 3) Destek linki ekle.
- **DOSYA:** `apps/web/src/components/ui/error-boundary.tsx`

### 9.2 Contextual Help/Tooltip Tamamen Eksik
- **SORUN:** Admin panelinde hicbir formda tooltip, info ikonu veya contextual help yok. "Oturum Zaman Asimi", "Rate Limit" gibi teknik terimlere aciklama yok.
- **ETKI:** Teknik bilgisi dusuk yoneticiler ayarlari yanlis yapar. Destek talepleri artar.
- **ONCELIK:** **Kritik**
- **COZUM:** Karmasik form alanlarinin yanina `<Tooltip>` ile aciklama ekle. `(?)` ikonu ile tetikle.

### 9.3 Form Validation Hatalari Generic
- **SORUN:** Onboarding ve admin formlarinda hata mesaji "Bir hata olustu". Spesifik alan hatasi yok.
- **ETKI:** Kullanici neyi duzeltecegini bilemez.
- **ONCELIK:** Yuksek
- **COZUM:** Zod schema hatalarini field-level mesajlara cevir. Her alan icin ozel hata mesaji tanimla.

### 9.4 API Hata Loglama Production'da Eksik
- **SORUN:** `auth-provider.tsx` sadece development ortaminda console.log yapiyor. Production'da structured logging yok.
- **ETKI:** Production hatalari izlenemez, debugging imkansiz.
- **ONCELIK:** Yuksek
- **COZUM:** Sentry veya benzeri error tracking servisi entegre et.

### 9.5 Bos Durum Yardim Icerigi Tutarsiz
- **SORUN:** Inbox bos durumunda iyi bir CTA var ("Iletisim Modulunu Ayarla") ama admin sayfalarinda minimal.
- **ETKI:** Kullanici admin'de bos state'te ne yapacagini bilemez.
- **ONCELIK:** Orta
- **COZUM:** Inbox'taki ornegi genellelestir. Her bos duruma: illustrasyon + aciklama + CTA butonu ekle.

---

## 10. TUTARLILIK VE STANDARTLASTIRMA

### 10.1 Native confirm() vs AlertDialog
- **SORUN:** Silme islemlerinde bazi sayfalar `confirm()`, bazilari `AlertDialog` kullaniyor.
- **ETKI:** UI deneyimi kirilir. Stil tutarsizligi. Kullanici guven hissi azalir.
- **ONCELIK:** **Kritik**
- **COZUM:** Tum `confirm()` kullanimlarini `AlertDialog` ile degistir.
- **DOSYA:** `apps/web/src/app/(dashboard)/admin/users/page.tsx`

### 10.2 Buton Hiyerarsisi Standart Degil
- **SORUN:** Sayfa basliklarindaki butonllar (outline vs default vs ghost) tutarsiz sirada. Birincil eylem (CTA) bazen solda bazen sagda.
- **ETKI:** Kullanici birincil eylemi bulmak icin taramak zorunda kalir.
- **ONCELIK:** Dusuk
- **COZUM:** Standart: CTA sag ust kose, variant="default". Ikincil eylemler variant="outline". Ucuncu variant="ghost".

### 10.3 Spacing/Padding Tutarsizligi
- **SORUN:** Admin sayfalar arasinda card padding, section gap ve form spacing farkli degerler kullaniyor.
- **ETKI:** Profesyonellik algisi duser. "El yapimi" hissi verir.
- **ONCELIK:** Orta
- **COZUM:** Design token'lardaki spacing degerlerini (gap-4, gap-6, p-6) standartlastir. `AdminPageLayout` wrapper componenti olustur.

### 10.4 Toast Mesaj Formati Tutarsiz
- **SORUN:** 77 toast kullanimi, farkli mesaj formatlari: "basarili", "kaydedildi", "olusturuldu", "silindi" vs.
- **ETKI:** Kullanici farkli sayfalarda farkli ton alir.
- **ONCELIK:** Dusuk
- **COZUM:** i18n key'leri uzerinden standartlastir. Basari: "{entity} kaydedildi", Hata: "{entity} kaydedilemedi" formati.

---

## ONCELIK MATRISI

### Kritik (Hemen Yapilmali) - 5 Sorun
| # | Sorun | Etki | Tahmini Efor |
|---|-------|------|--------------|
| 1 | 'use client' asiri kullanim | Performance %20-30 | Yuksek |
| 2 | Native confirm() → AlertDialog | UI tutarliligi | Dusuk |
| 3 | Error Boundary bilgilendirme | Kullanici memnuniyeti | Dusuk |
| 4 | Contextual Help/Tooltip eksik | Kullanilabilirlik | Orta |
| 5 | Sidebar toggle aria-label | A11y uyumluluk | Cok Dusuk |

### Yuksek Oncelik - 12 Sorun
| # | Sorun | Etki | Tahmini Efor |
|---|-------|------|--------------|
| 6 | Sidebar mobil davranisi | Mobil UX | Orta |
| 7 | Tablo responsive | Mobil UX | Orta |
| 8 | Onboarding akisi | Activation rate | Yuksek |
| 9 | React Suspense eksik | Performance | Orta |
| 10 | Dynamic import eksik | Bundle size | Dusuk |
| 11 | react-hook-form entegrasyonu | Form UX | Yuksek |
| 12 | Inline validation | Form UX | Orta |
| 13 | Loading state tutarsizligi | Gorsel geri bildirim | Dusuk |
| 14 | Renk kontrasti testi | A11y | Dusuk |
| 15 | Klavye navigasyonu | A11y | Orta |
| 16 | console.log kaldir | Guvenlik | Cok Dusuk |
| 17 | Sentry entegrasyonu | Hata izleme | Orta |

### Orta Oncelik - 17 Sorun
### Dusuk Oncelik - 12 Sorun

---

## ONERILEN UYGULAMA SIRASI

### Sprint 1: Kritik Duzeltmeler (1-2 hafta)
1. `confirm()` → `AlertDialog` degistirme
2. Sidebar `aria-label` ekleme
3. Error boundary iyilestirme
4. `console.log` temizleme
5. Temel tooltip'ler ekleme

### Sprint 2: Performans (2-3 hafta)
1. Server/Client component ayristirma
2. Dynamic imports ekleme
3. `loading.tsx` dosyalari ekleme
4. React Suspense boundaries
5. next/image migrasyonu

### Sprint 3: Mobil & A11y (2-3 hafta)
1. Sidebar mobile Sheet pattern
2. Tablo responsive
3. Touch target duzeltmeleri
4. Klavye navigasyonu
5. Renk kontrasti audit

### Sprint 4: Form & Akis (3-4 hafta)
1. react-hook-form entegrasyonu
2. Inline validation
3. Onboarding wizard
4. Admin hub sayfasi
5. Inbox split-view

---

**Rapor Sonu**
*Bu rapor Gemini (yapisal analiz), Claude Explore (component + akis analizi) ve Claude (koordinasyon) tarafindan uretilmistir.*
