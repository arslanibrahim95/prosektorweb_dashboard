# 🚨 Uygulama Kaputu Altındaki Saatli Bomba: `AppShell` İncelemesi

Bu rapor, `apps/web/src/components/layout/app-shell.tsx` dosyasının acımasız ve tavizsiz bir kod incelemesini içerir. "Çalışıyorsa dokunma" mantığıyla yazılmış bu tipik Frankenstein bileşeni, React'ın temel prensiplerine, Next.js App Router mimarisine ve yazılım mühendisliği standartlarına tamamen aykırı, saatli bomba gibi bekleyen devasa kusurlar içermektedir.

---

## 1. 🚨 KRİTİK HATA (SHOWSTOPPER): SSR Hydration Mismatch ve UI Jank

**Sorunlu Kod:**
```tsx
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return safeLocalStorageGetItem('sidebar-collapsed') === 'true';
});
```

**Neden Yanlış?**
Next.js gibi SSR destekleyen bir framework'te `window` ve `localStorage` sunucuda yoktur. `safeLocalStorageGetItem` sunucuda büyük ihtimalle `null` (veya undefined) dönecektir. Sunucu tarafında `sidebarCollapsed` state'i kesinlikle `false` olarak hesaplanacaktır. Sunucu HTML'i buna göre üretip gönderir. 
Client tarafında React ayağa kalkarken (hydration aşaması) aynı `useState` hook'u çalışır, bu kez tarayıcıdadır ve okuduğu değer `'true'` olabilir. 

**Sonuç (Impact):**
1. **Hydration Error:** React konsolda bas bas bağıracak: *"Warning: Prop `className` did not match. Server: lg:ml-[var(--sidebar-width)] Client: lg:ml-[calc(var(--sidebar-width-collapsed)+16px)]"*.
2. **Korkunç Kullanıcı Deneyimi (UI Jank):** Sayfa yüklendiğinde sidebar geniş gözükecek (sunucu render'ı), saniyenin onda biri sonra aniden, CSS transition eşliğinde daralacaktır. Kullanıcı her sayfa yenilediğinde ekran sağa sola kayacak, midesi bulanacaktır.

**Çözüm:** 
State'i server component'te cookie'den okuyup prop olarak geçmeli veya UI hydration tamamlandıktan sonra (örn: `useEffect` içinde isMounted bayrağı ile) storage okumasını yapmalısınız.

---

## 2. 🐢 PERFORMANS FELAKETİ: Ölümcül Re-Render Şelalesi

**Sorunlu Kod:**
```tsx
const sidebarCtx = {
    isOpen: isSidebarOpen,
    toggle: () => setIsSidebarOpen(prev => !prev),
    close: () => setIsSidebarOpen(false),
};

return (
    <SidebarContext.Provider value={sidebarCtx}>
        {/* ... */}
```

**Neden Yanlış?**
Bu en klasik React acemiliğidir. Her `AppShell` render'ında (örneğin route değiştiğinde, URL query değiştiğinde vs.) `sidebarCtx` **yepyeni bir bellek referansına** sahip bir obje olarak yeniden yaratılır. `SidebarContext.Provider` kendisine gelen `value` referansı değiştiği için, uygulamanızda `useSidebar` hook'unu kullanan **istisnasız her component'i (bağlı oldukları DOM'a kadar) zorla baştan render (re-render) edecektir.**

**Sonuç:** 
`isSidebarOpen` değeri hiç değişmemiş olsa bile, uygulamadaki tüm sidebar consumer'ları gereksiz yere render edilir. Uygulama büyüdükçe uygulamanın donmasına, mobil cihazlarda FPS düşüşlerine ve aşırı ısınmaya (battery drain) yol açar. Provider value'su mutlaka `useMemo` ile sarmalanmalıdır.

---

## 3. 🏗 MİMARİ KUSURLAR VE STATE KARMAŞASI (Spaghetti Design)

**Sorunlu Kod:**
```tsx
export const SidebarContext = createContext<{ ... }>({ ... });
```

Bu Context **sadece** `isSidebarOpen` (mobil overlay durumu) için yazılmış. Peki ya `sidebarCollapsed` (masaüstünde sidebar'ın daraltılması) state'i nerede? Global Layout seviyesinde tutulmuş fakat **hiçbir şekilde context üzerinden dış dünyaya açılmamış**.

Eğer içerde bir children component'in (örneğin bir tablo veya veri ızgarası) sidebar'ın geniş mi dar mı olduğuna göre kendi boyutunu ayarlaması veya farklı bir layout sunması gerekirse bunu asla yapamayacak! Çünkü o data `AppShell` içine gömülü kalmış. 

Özetle, Context'in ismi `SidebarContext` ama sidebar'ın en önemli state'lerinden birini barındırmıyor bile. Yarı pişmiş bir tasarım.

---

## 4. 🕳 ERROR HANDLING: "Top yekün çöküş"

**Sorunlu Kod:**
```tsx
<main className="...">
    <div className="dashboard-main-content page-enter">
        <Breadcrumbs />
        <ErrorBoundary>
            {children}
        </ErrorBoundary>
    </div>
</main>
```

**Neden Yanlış?**
`ErrorBoundary` sadece `children` kısmını sarıyor. 

**Corner Case & Impact:**
Eğer `MobileNav`, `Breadcrumbs`, `Topbar` veya `Sidebar` componentlerinden birinde bir runtime hatası olursa (örneğin backendden null gelen bir değeri okumaya çalışmak, ya da hatalı bir URL mapping'i vs.), ErrorBoundary hiçbir işe yaramayacaktır. 

React, yaşam döngüsündeki yakalanmayan hatalarda **tüm DOM tree'yi yıkar (unmount).** Sonuç? Bembeyaz bir ekran (White Screen of Death). Kullanıcıya düzgün bir "Hata oluştu" UI'si göstermek yerine, uygulamayı tamamen kaybedersiniz. Tüm ana framework elementleri koruma altına alınmalıdır.

---

## 5. ♿ ERİŞİLEBİLİRLİK (A11Y) CİNAYETİ

**Sorunlu Kod:**
```tsx
{isSidebarOpen && (
    <div
        className="fixed inset-0 z-40 glass-strong !bg-black/55 lg:hidden transition-opacity"
        onClick={() => setIsSidebarOpen(false)}
    />
)}
```

**Neden Yanlış?**
Sıradan bir `<div>` etiketine `onClick` basmışsınız.
1. Klavyeyle gezen bir kullanıcı bu overlay'e odaklanamaz, çünkü `tabIndex`'i yok.
2. Odaklansa bile "Enter" veya "Space" ile çalıştıramaz, çünkü `onKeyDown` hook'u yok.
3. Ekran okuyucular (Screen readers) bunun bir kapatma mekanizması olduğunu anlamaz çünkü `role="button"` veya `aria-label` özellikleri eksik.

Bu kod parçası, WCAG standartları testlerinden **direkt olarak kalır** ve erişilebilirlik davasına konu olabilir.

---

## 6. 🗑️ BUNDLE SIZE VE ŞİŞKİNLİK: "Çöp Kutusu Anti-Pattern'ı"

**Sorunlu Kod:**
```tsx
<CommandPalette />
<ShortcutsHelp />
<HelpSheet />
<WelcomeModal />
<TenantOnboardingDrawer />
<Toaster richColors position="bottom-right" />
```

**Neden Yanlış?**
Tüm global modalları dosyanın en altına koca bir yığın olarak eklemişsiniz.
**Sonuç:** `AppShell` yüklendiği an bu componentlerin **tümü** indiriliyor ve React ağacına mount ediliyor! 
Eğer `TenantOnboardingDrawer` içinde ağır bir modül veya bir API araması (`useQuery` vs.) varsa, çekmece açık olmasa bile o istekler yapılabilir veya o JavaScript kodu cihazın hafızasını işgal eder. 

**Çözüm:** Bu bileşenleri `next/dynamic` ile tembel yüklemeli (lazy load) duruma getirmelisiniz.

---

## 7. 🕸️ ZOMBİ STATE (Edge Case: Viewport Resize Bug)

**Senaryo:**
1. Uygulamayı bir tablette (dikey) açtınız. Mobilsiniz, menü butonuna bastınız: `isSidebarOpen = true`. Mobil menü (overlay) açıldı.
2. Ardından tableti yatay (landscape) konuma çevirdiniz.
3. CSS'teki `lg:hidden` sınıfları sayesinde mobil menü DOM'da görünmez oldu. Sidebar doğal masaüstü moduna geçti.
4. **Fakat state hala `isSidebarOpen = true`!** Arka planda sessizce bekliyor. Tarayıcıyı tekrar daralttığınızda, siz hiçbir şeye basmamış olmanıza rağmen o çirkin siyah overlay ekranda tekrar durduk yere belirecek.

**Çözüm:** Ekran boyutu değiştiğinde `isMobileOpen` state'ini zorla `false` yapan bir window resize dinleyicisine (örneğin `useMediaQuery` tabanlı bir mantığa) ihtiyacınız var.

---

## 8. 💀 CLEAN CODE VE SOLID PRENSİPLERİ İHLALLERİ

**A. Hardcoded Magic Numbers (Sihirli Sayılar):**
- `pb-16`: Neden 16? (4rem = 64px) neyi temsil ediyor? Muhtemelen MobileNav'in yüksekliğini. Bu `pb` class'ı burada hardcoded unutulacak ve her şey patlayacak. Bunun css değişkeni olarak (örneğin `padding-bottom: var(--mobile-nav-height)`) tanımlanması gerekir.
- `calc(var(--sidebar-width-collapsed)+16px)`: Buradaki `+16px` nereden çıktı? Bu tür hesaplamalar Tailwind içine statik yazılmamalı, CSS değişkenleri ile yönetilmelidir.

**B. Typescript DRY İhlali (Code Duplication):**
```tsx
user?: { name: string; email: string; avatar_url?: string; };
tenant?: { name: string; };
```
Veritabanı veya domain katmanınızdan gelen Type/Interface'leri import etmek yerine inline tanımlamışsınız. Veritabanında bir kolon eklenirse veya değişirse bu dosya TypeScript güvencesinden yoksun kalacak.

**C. Fail-Safe Context Tasarımı:**
`useSidebar` şu anda hatalı kullanıldığında hata fırlatmıyor:
```tsx
export const useSidebar = () => useContext(SidebarContext);
```
Eğer geliştirici yanlışlıkla `AppShell` dışında `useSidebar` kullanırsa içi boş saçma fonksiyonlar çalışır. Uygulama patlamadığı için hatayı bulmanız saatler alır. Doğrusu: Context `null` ise `throw new Error()` fırlatmaktır.

---

## 9. 🛠 NASIL YAZILMALIYDI? (REFACTORING ÖNERİSİ)

Aşağıdaki yapılandırılmış, belleği koruyan, zombi state barındırmayan, erişilebilir ve Hydration Safe versiyonu inceleyiniz:

```tsx
'use client';

import { ReactNode, useState, createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Breadcrumbs } from './breadcrumbs';
import { Toaster } from '@/components/ui/sonner';
import { MobileNav } from './mobile-nav';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/storage';
import type { User, Tenant } from '@/types/models'; // Doğru modeller

// Tembel yüklenen (Lazy Load) ağır komponentler
const CommandPalette = dynamic(() => import('@/components/search/command-palette').then(m => m.CommandPalette), { ssr: false });
const ShortcutsHelp = dynamic(() => import('./shortcuts-help').then(m => m.ShortcutsHelp), { ssr: false });
const HelpSheet = dynamic(() => import('@/components/help/help-sheet').then(m => m.HelpSheet), { ssr: false });
const WelcomeModal = dynamic(() => import('@/components/onboarding/welcome-modal').then(m => m.WelcomeModal), { ssr: false });
const TenantOnboardingDrawer = dynamic(() => import('@/components/onboarding/tenant-onboarding-drawer').then(m => m.TenantOnboardingDrawer), { ssr: false });

interface AppShellProps {
    children: ReactNode;
    defaultSidebarCollapsed?: boolean; 
    user?: User;
    tenant?: Pick<Tenant, 'name'>;
}

interface SidebarContextValue {
    isMobileOpen: boolean;
    isDesktopCollapsed: boolean;
    toggleMobile: () => void;
    closeMobile: () => void;
    toggleDesktop: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) throw new Error("useSidebar must be used within an AppShell Provider");
    return context;
};

// --- Viewport State Yönetimi ---
function useMobileViewport() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia('(max-width: 1024px)');
        const onChange = () => setIsMobile(mql.matches);
        onChange(); 
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);
    return isMobile;
}

export function AppShell({ children, user, tenant, defaultSidebarCollapsed = false }: AppShellProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    
    // Server-Client uyumu için default değere güven 
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(defaultSidebarCollapsed);
    const [isMounted, setIsMounted] = useState(false);
    const isMobileViewport = useMobileViewport();

    // Hydration tamamlandıktan sonra güvenli depolama erişimi
    useEffect(() => {
        setIsMounted(true);
        const stored = safeLocalStorageGetItem('sidebar-collapsed');
        if (stored !== null) setIsDesktopCollapsed(stored === 'true');
    }, []);

    // Resize sonrası zombi state temizliği
    useEffect(() => {
        if (!isMobileViewport && isMobileOpen) setIsMobileOpen(false);
    }, [isMobileViewport, isMobileOpen]);

    const handleToggleDesktop = useCallback(() => {
        setIsDesktopCollapsed(prev => {
            const nextValue = !prev;
            requestAnimationFrame(() => safeLocalStorageSetItem('sidebar-collapsed', String(nextValue)));
            return nextValue;
        });
    }, []);

    const handleToggleMobile = useCallback(() => setIsMobileOpen(p => !p), []);
    const handleCloseMobile = useCallback(() => setIsMobileOpen(false), []);

    // Ölümcül Re-Render Şelalesini Durdurmak için useMemo!
    const contextValue = useMemo(() => ({
        isMobileOpen,
        isDesktopCollapsed,
        toggleMobile: handleToggleMobile,
        closeMobile: handleCloseMobile,
        toggleDesktop: handleToggleDesktop
    }), [isMobileOpen, isDesktopCollapsed, handleToggleMobile, handleCloseMobile, handleToggleDesktop]);

    return (
        <SidebarContext.Provider value={contextValue}>
            <div className="min-h-screen bg-background flex flex-col relative w-full overflow-hidden">
                
                {/* A11Y dostu (Klavye Destekli) Overlay */}
                {isMobileOpen && (
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Menüyü Kapat"
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' || e.key === 'Enter') handleCloseMobile();
                        }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity cursor-pointer"
                        onClick={handleCloseMobile}
                    />
                )}

                <Sidebar collapsed={isDesktopCollapsed} onToggleCollapse={handleToggleDesktop} />
                <Topbar user={user} tenant={tenant} sidebarCollapsed={isDesktopCollapsed} />

                <main className={`pt-[var(--topbar-height)] pb-[var(--mobile-nav-height)] lg:pb-0 min-h-screen transition-[margin-left] duration-500 ease-[var(--ease-spring)] ${isDesktopCollapsed ? 'lg:ml-[var(--sidebar-width-collapsed)]' : 'lg:ml-[var(--sidebar-width)]'}`}>
                    <div className="dashboard-main-content page-enter h-full w-full">
                        <ErrorBoundary fallback={<div className="p-4 text-destructive">Kritik bir hata oluştu.</div>}>
                            <Breadcrumbs />
                            {children}
                        </ErrorBoundary>
                    </div>
                </main>

                <MobileNav />

                {/* Sadece Mounted olduktan sonra Lazy Load olan bileşenleri listele */}
                {isMounted && (
                    <>
                        <CommandPalette />
                        <ShortcutsHelp />
                        <HelpSheet />
                        <WelcomeModal />
                        <TenantOnboardingDrawer />
                        <Toaster richColors position="bottom-right" />
                    </>
                )}
            </div>
        </SidebarContext.Provider>
    );
}
```
