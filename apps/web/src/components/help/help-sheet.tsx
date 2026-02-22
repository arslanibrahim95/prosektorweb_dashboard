'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { HelpCircle, ExternalLink, Keyboard, Lightbulb, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface HelpContent {
  title: string;
  description: string;
  tips: string[];
  shortcuts?: { key: string; description: string }[];
  links?: { label: string; href: string }[];
}

const helpContentMap: Record<string, HelpContent> = {
  '/home': {
    title: 'Ana Sayfa',
    description: 'Sitenizin genel durumunu, son aktiviteleri ve hızlı erişim bağlantılarını buradan takip edebilirsiniz.',
    tips: [
      'İstatistik kartlarına tıklayarak ilgili bölüme hızlıca geçebilirsiniz.',
      'Başlangıç kontrol listesini tamamlayarak sitenizi aktif hale getirin.',
      'Son aktiviteler bölümünden gelen teklif ve mesajları takip edin.',
    ],
    shortcuts: [
      { key: 'g h', description: 'Ana Sayfaya git' },
      { key: 'g i', description: 'Gelen Kutusuna git' },
    ],
    links: [
      { label: 'Gelen Kutusu', href: '/inbox/offers' },
      { label: 'Ayarlar', href: '/settings/users' },
    ],
  },
  '/site/domains': {
    title: 'Domainler',
    description: 'Sitenize bağlı domain adreslerini yönetin, DNS ayarlarını yapılandırın ve SSL sertifikalarını kontrol edin.',
    tips: [
      'Yeni bir domain eklemek için "Domain Ekle" butonuna tıklayın.',
      'DNS yayılması 24-48 saat sürebilir, sabırlı olun.',
      'SSL sertifikanız otomatik olarak oluşturulur ve yenilenir.',
      'Birincil domaini değiştirmek sitenizin URL yapısını etkiler.',
    ],
    links: [
      { label: 'SEO Ayarları', href: '/site/seo' },
      { label: 'Yayın Durumu', href: '/site/publish' },
    ],
  },
  '/site/seo': {
    title: 'SEO Ayarları',
    description: 'Sitenizin arama motorlarındaki görünürlüğünü artırmak için meta etiketleri ve içerikleri düzenleyin.',
    tips: [
      'Meta başlık 50-60 karakter arasında olmalıdır.',
      'Meta açıklama 150-160 karakter arasında tutun.',
      'Anahtar kelimeleri doğal bir şekilde içeriğe dahil edin.',
      'Görseller için alt text eklemek SEO\'yu olumlu etkiler.',
    ],
    links: [
      { label: 'Domainler', href: '/site/domains' },
      { label: 'Yayın Durumu', href: '/site/publish' },
    ],
  },
  '/site/publish': {
    title: 'Yayın Yönetimi',
    description: 'Sitenizi yayına alın, yayından kaldırın ve yayın durumunu takip edin.',
    tips: [
      'Yayına almadan önce tüm içeriklerin tamamlandığından emin olun.',
      'Değişiklikler yayınlandıktan sonra birkaç dakika içinde görünür.',
      'Yayından kaldırılan siteler domain\'e erişildiğinde bakım sayfası gösterir.',
    ],
    shortcuts: [
      { key: 'g p', description: 'Yayın sayfasına git' },
    ],
    links: [
      { label: 'Domainler', href: '/site/domains' },
      { label: 'SEO Ayarları', href: '/site/seo' },
    ],
  },
  '/modules/offer': {
    title: 'Teklif Modülü',
    description: 'Web sitenizden gelen teklif taleplerini yönetin, alıcı e-posta adreslerini ve KVKK ayarlarını yapılandırın.',
    tips: [
      'Alıcı e-posta adreslerini virgülle ayırarak birden fazla kişiye iletebilirsiniz.',
      'KVKK onay metni formlarda zorunlu olarak gösterilir.',
      'Teklif talepleri gelen kutusunda "Teklifler" sekmesinde görünür.',
      'E-posta şablonlarını özelleştirerek daha profesyonel görünüm sağlayın.',
    ],
    links: [
      { label: 'Gelen Kutusu - Teklifler', href: '/inbox/offers' },
      { label: 'İletişim Modülü', href: '/modules/contact' },
    ],
  },
  '/modules/contact': {
    title: 'İletişim Modülü',
    description: 'Adres, telefon, e-posta gibi iletişim bilgilerini ve iletişim formunu yönetin.',
    tips: [
      'Harita entegrasyonu için doğru adres bilgisi girildiğinden emin olun.',
      'Sosyal medya bağlantılarını ekleyerek erişilebilirliği artırın.',
      'İletişim formu mesajları gelen kutusunda "İletişim" sekmesinde görünür.',
    ],
    links: [
      { label: 'Gelen Kutusu - İletişim', href: '/inbox/contact' },
      { label: 'Teklif Modülü', href: '/modules/offer' },
    ],
  },
  '/modules/hr': {
    title: 'İnsan Kaynakları',
    description: 'İş ilanları oluşturun ve başvuruları yönetin.',
    tips: [
      'İş ilanları yayınlandıktan sonra web sitenizde otomatik görünür.',
      'Başvurular gelen kutusundaki "Başvurular" sekmesinden takip edilebilir.',
      'İlanları kapatarak yeni başvuruları durdurabilirsiniz.',
      'Her ilan için gereklilikler ve sorumlulukları detaylı belirtin.',
    ],
    links: [
      { label: 'Gelen Kutusu - Başvurular', href: '/inbox/applications' },
    ],
  },
  '/modules/legal': {
    title: 'Yasal Metinler',
    description: 'KVKK aydınlatma metni, gizlilik politikası ve kullanım koşullarını yönetin.',
    tips: [
      'KVKK metni tüm formlar için zorunlu onay olarak kullanılır.',
      'Yasal metinleri güncel tutmak yasal uyumluluğunuz için kritiktir.',
      'Değişiklikler web sitenizde hemen güncellenir.',
    ],
    links: [
      { label: 'Teklif Modülü', href: '/modules/offer' },
      { label: 'İletişim Modülü', href: '/modules/contact' },
    ],
  },
  '/inbox': {
    title: 'Gelen Kutusu',
    description: 'Web sitenizdeki formlardan gelen teklif talepleri, iletişim mesajları ve iş başvurularını buradan yönetin.',
    tips: [
      'Teklifler, İletişim ve Başvurular sekmelerini kullanarak filtreleme yapın.',
      'Okunmamış mesajlar üst kısımdaki bildirim ikonunda sayı olarak gösterilir.',
      'Mesajları arşivleyerek gelen kutusunu düzenli tutun.',
    ],
    shortcuts: [
      { key: 'g i', description: 'Gelen Kutusuna git' },
    ],
    links: [
      { label: 'Teklif Modülü Ayarları', href: '/modules/offer' },
      { label: 'İletişim Modülü Ayarları', href: '/modules/contact' },
    ],
  },
  '/analytics': {
    title: 'Analitik',
    description: 'Sitenizin ziyaretçi istatistiklerini, trafik kaynaklarını ve performans metriklerini inceleyin.',
    tips: [
      'Grafiklere tıklayarak belirli dönemleri yakından inceleyebilirsiniz.',
      'Trafik kaynakları sütunu hangi kanalların daha verimli olduğunu gösterir.',
      'Yüksek hemen çıkma oranı sayfanın optimize edilmesi gerektiğine işaret edebilir.',
    ],
    links: [
      { label: 'SEO Ayarları', href: '/site/seo' },
      { label: 'Ana Sayfa', href: '/home' },
    ],
  },
  '/settings': {
    title: 'Ayarlar',
    description: 'Bildirim tercihlerinizi, kullanıcı yönetimini ve fatura bilgilerini buradan yönetin.',
    tips: [
      'Kullanıcıları davet etmek için "Kullanıcılar" sekmesini kullanın.',
      'E-posta bildirimlerini "Bildirimler" sekmesinden özelleştirebilirsiniz.',
      'Fatura ve abonelik bilgileri "Fatura" sekmesinde yer alır.',
    ],
    shortcuts: [
      { key: 'g s', description: 'Ayarlara git' },
    ],
    links: [
      { label: 'Ana Sayfa', href: '/home' },
    ],
  },
  '/admin': {
    title: 'Admin Panel',
    description: 'Gelişmiş sistem yönetimi, tenant kontrolü ve global yapılandırma ayarları.',
    tips: [
      'Bu bölüm yalnızca yetkili yöneticiler tarafından kullanılabilir.',
      'Tenant işlemleri tüm kullanıcıları etkileyebilir, dikkatli olun.',
      'Sistem ayarlarını değiştirmeden önce yedek almanız önerilir.',
    ],
    links: [
      { label: 'Ayarlar', href: '/settings/users' },
    ],
  },
};

const defaultHelp: HelpContent = {
  title: 'Yardım',
  description: 'ProsektorWeb Dashboard yönetim panelidir. Sol menüden istediğiniz bölüme geçebilirsiniz.',
  tips: [
    '? tuşuna basarak bu yardım panelini açabilirsiniz.',
    '⌘K veya Ctrl+K ile arama paletini açabilirsiniz.',
    'Sol menüdeki bağlantıları kullanarak bölümler arasında geçiş yapın.',
  ],
  shortcuts: [
    { key: 'g h', description: 'Ana Sayfaya git' },
    { key: 'g i', description: 'Gelen Kutusuna git' },
    { key: 'g s', description: 'Ayarlara git' },
  ],
};

function getHelpContent(pathname: string): HelpContent {
  // Exact match first
  if (helpContentMap[pathname]) return helpContentMap[pathname];

  // Prefix match (longest prefix wins)
  const prefixes = Object.keys(helpContentMap).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      const content = helpContentMap[prefix];
      if (content) return content;
    }
  }

  return defaultHelp;
}

export function HelpSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-help-sheet', handler);
    return () => window.removeEventListener('open-help-sheet', handler);
  }, []);

  const content = getHelpContent(pathname);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">{content.title}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Yardım & İpuçları</p>
            </div>
          </div>
          <SheetDescription className="text-sm leading-relaxed pt-1">
            {content.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Tips */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">İpuçları</span>
            </div>
            <ul className="space-y-2">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Shortcuts */}
          {content.shortcuts && content.shortcuts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Keyboard className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kısayollar</span>
              </div>
              <div className="space-y-1.5">
                {content.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/40"
                  >
                    <span className="text-sm text-foreground/80">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.key.split(' ').map((k, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && <span className="text-muted-foreground text-[10px] mx-0.5">sonra</span>}
                          <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground">
                            {k === '?' ? '?' : k.toUpperCase()}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          {content.links && content.links.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hızlı Bağlantılar</span>
              </div>
              <div className="space-y-1.5">
                {content.links.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-8 text-sm font-normal text-foreground/80 hover:text-foreground"
                    onClick={() => {
                      setOpen(false);
                      router.push(link.href);
                    }}
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Global shortcuts hint */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-normal gap-1">
                <kbd className="font-mono">?</kbd>
                <span>Bu paneli aç</span>
              </Badge>
              <Badge variant="outline" className="text-[10px] font-normal gap-1">
                <kbd className="font-mono">⌘K</kbd>
                <span>Arama</span>
              </Badge>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
