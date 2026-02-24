import type { NavIconName } from './sidebar-nav-icons';

// ── Navigation Item Types ─────────────────────────────────────────────────────

export interface NavItem {
    label: string;
    labelKey?: string; // i18n translation key (örn: 'nav.home')
    href: string;
    icon: NavIconName;
    children?: NavItem[];
    badge?: string;
    color?: string;
}

export interface NavSection {
    label?: string;
    items: NavItem[];
}

// ── Navigation Data ──────────────────────────────────────────────────────────

export const navSections: NavSection[] = [
    {
        items: [
            {
                label: 'Ana Sayfa',
                labelKey: 'nav.home',
                href: '/home',
                icon: 'LayoutDashboard',
            },
        ],
    },
    {
        label: 'SİTE',
        items: [
            {
                label: 'Site',
                labelKey: 'nav.site',
                href: '/site',
                icon: 'Globe',
                color: 'text-blue-400',
                children: [
                    { label: 'Vibe Üretim', labelKey: 'nav.generate', href: '/site/generate', icon: 'Sparkles' },
                    { label: 'Sayfalar', labelKey: 'nav.pages', href: '/site/pages', icon: 'FileText' },
                    { label: 'Sayfa Düzenleyici', labelKey: 'nav.builder', href: '/site/builder', icon: 'Pencil' },
                    { label: 'Domainler', labelKey: 'nav.domains', href: '/site/domains', icon: 'Link2' },
                    { label: 'SEO', labelKey: 'nav.seo', href: '/site/seo', icon: 'Search' },
                    { label: 'Yayınla', labelKey: 'nav.publish', href: '/site/publish', icon: 'Send' },
                ],
            },
            {
                label: 'Modüller',
                labelKey: 'nav.modules',
                href: '/modules',
                icon: 'Package',
                color: 'text-violet-400',
                children: [
                    { label: 'Teklif Alma', labelKey: 'nav.offers', href: '/modules/offer', icon: 'Zap' },
                    { label: 'İletişim', labelKey: 'nav.contacts', href: '/modules/contact', icon: 'MessageSquare' },
                    { label: 'Randevu Talebi', labelKey: 'nav.appointments', href: '/modules/appointment', icon: 'Calendar' },
                    { label: 'İş İlanları', labelKey: 'nav.jobPosts', href: '/modules/hr/job-posts', icon: 'Briefcase' },
                    { label: 'Başvurular', labelKey: 'nav.applications', href: '/modules/hr/applications', icon: 'Users' },
                    { label: 'Yasal Metinler', labelKey: 'nav.legalTexts', href: '/modules/legal', icon: 'Scale' },
                ],
            },
        ],
    },
    {
        label: 'GELEN KUTUSU',
        items: [
            {
                label: 'Gelen Kutusu',
                labelKey: 'nav.inbox',
                href: '/inbox',
                icon: 'Inbox',
                color: 'text-emerald-400',
                children: [
                    { label: 'Teklifler', labelKey: 'nav.offers', href: '/inbox/offers', icon: 'Zap' },
                    { label: 'İletişim', labelKey: 'nav.contacts', href: '/inbox/contact', icon: 'MessageSquare' },
                    { label: 'Randevular', labelKey: 'nav.appointments', href: '/inbox/appointments', icon: 'Calendar' },
                    { label: 'Başvurular', labelKey: 'nav.applications', href: '/inbox/applications', icon: 'Briefcase' },
                ],
            },
        ],
    },
    {
        label: 'İŞLEMLER',
        items: [
            {
                label: 'Müşteriler',
                labelKey: 'nav.crm',
                href: '/crm',
                icon: 'UserCircle',
                color: 'text-cyan-400',
            },
            {
                label: 'Projeler',
                labelKey: 'nav.projects',
                href: '/projects',
                icon: 'FolderKanban',
                color: 'text-rose-400',
            },
            {
                label: 'Analitik',
                labelKey: 'nav.analytics',
                href: '/analytics',
                icon: 'LineChart',
                color: 'text-amber-400',
            },
        ],
    },
    {
        label: 'HESAP',
        items: [
            {
                label: 'Ayarlar',
                labelKey: 'nav.settings',
                href: '/settings',
                icon: 'Settings',
                children: [
                    { label: 'Kullanıcılar', labelKey: 'nav.users', href: '/settings/users', icon: 'Users' },
                    { label: 'Bildirimler', labelKey: 'nav.notifications', href: '/settings/notifications', icon: 'Inbox' },
                    { label: 'Fatura & Plan', labelKey: 'nav.billing', href: '/settings/billing', icon: 'FileText' },
                    { label: 'Dosyalar', labelKey: 'nav.files', href: '/settings/files', icon: 'HardDrive' },
                    { label: 'Supabase', labelKey: 'nav.supabase', href: '/settings/supabase', icon: 'Database' },
                    { label: 'Aktivite Logu', labelKey: 'nav.activityLog', href: '/settings/activity-log', icon: 'Activity' },
                ],
            },
        ],
    },
];

// Flat list for legacy compatibility
export const navItems: NavItem[] = navSections.flatMap(s => s.items);

// ── Mobile Navigation Helper ─────────────────────────────────────────────────────

/**
 * Mobile navigasyon için uygun item'ları çıkarır.
 * Her section'tan ilk item'ı alır (parent'ları).
 * Bu fonksiyon, mobile-nav bileşeninin tekrar navigasyon 
 * tanımlamamasını sağlar - tek kaynak olarak bu dosya kullanılır.
 *
 * @example
 * const mobileItems = getMobileNavItems();
 * // [{ label: 'Ana Sayfa', href: '/home', icon: 'LayoutDashboard', matchPrefix: undefined }, ...]
 */
export interface MobileNavItem {
    label: string;
    labelKey?: string; // i18n translation key
    href: string;
    icon: NavIconName;
    /** URL eşleştirme için prefix (children olan item'lar için) */
    matchPrefix?: string;
    /** Badge gösterilip gösterilmeyeceğini belirleyen ID */
    badgeId?: string;
}

export function getMobileNavItems(): MobileNavItem[] {
    const mobileItems: MobileNavItem[] = [];

    for (const section of navSections) {
        for (const item of section.items) {
            // Her section'tan sadece parent item'ı al
            const mobileItem: MobileNavItem = {
                label: item.label,
                labelKey: item.labelKey,
                href: item.href,
                icon: item.icon,
                // Children varsa matchPrefix kullan (örneğin /inbox -> /inbox/*)
                matchPrefix: item.children ? item.href : undefined,
                // Badge gösterimi için inbox ID
                badgeId: item.href === '/inbox' ? 'inbox' : undefined,
            };
            mobileItems.push(mobileItem);

            // Her section'tan sadece ilk item'ı al (children'ları alma)
            break;
        }
    }

    return mobileItems;
}
