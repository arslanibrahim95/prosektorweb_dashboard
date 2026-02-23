'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Palette, Type, Layout, Eye, RotateCcw, Check } from 'lucide-react';
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-admin';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────
interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
}

interface PresetTheme {
    id: string;
    name: string;
    colors: ThemeColors;
}

interface ThemeSettingsPayload {
    colors?: ThemeColors;
    fontFamily?: string;
    baseFontSize?: number;
    headingFont?: string;
    lineHeight?: string;
    sidebarWidth?: number;
    borderRadius?: string;
    shadowStyle?: string;
    compactMode?: boolean;
}

interface AdminSettingsResponse {
    tenant?: { settings?: { theme?: ThemeSettingsPayload } };
}

// ── Color label mapping ──────────────────────────────────────────────────
const COLOR_LABELS: Record<string, string> = {
    primary: 'Ana Renk',
    secondary: 'İkincil Renk',
    accent: 'Vurgu Rengi',
    background: 'Arka Plan',
    text: 'Metin Rengi',
    success: 'Başarı',
    warning: 'Uyarı',
    error: 'Hata',
};

// ── Presets ───────────────────────────────────────────────────────────────
const DEFAULT_COLORS: ThemeColors = {
    primary: 'var(--primary)', secondary: 'var(--secondary)', accent: 'var(--accent)', background: 'var(--background)',
    text: 'var(--foreground)', success: 'var(--success)', warning: 'var(--warning)', error: 'var(--destructive)',
};

const PRESETS: PresetTheme[] = [
    { id: 'default', name: 'Sistem Teması', colors: DEFAULT_COLORS },
    {
        id: 'dark-professional', name: 'Koyu Profesyonel',
        colors: { primary: 'oklch(0.60 0.16 250)', secondary: 'oklch(0.35 0 0)', accent: 'oklch(0.76 0.16 290)', background: 'oklch(0.145 0 0)', text: 'oklch(0.97 0 0)', success: 'oklch(0.55 0.24 160)', warning: 'oklch(0.68 0.18 70)', error: 'oklch(0.55 0.22 25)' },
    },
    {
        id: 'light-minimal', name: 'Açık Minimal',
        colors: { primary: 'oklch(0.55 0.20 250)', secondary: 'oklch(0.87 0 0)', accent: 'oklch(0.65 0.22 25)', background: 'oklch(0.985 0 0)', text: 'oklch(0.205 0 0)', success: 'oklch(0.55 0.24 160)', warning: 'oklch(0.68 0.18 70)', error: 'oklch(0.55 0.22 25)' },
    },
    {
        id: 'blue-corporate', name: 'Mavi Kurumsal',
        colors: { primary: 'oklch(0.48 0.18 250)', secondary: 'oklch(0.708 0 0)', accent: 'oklch(0.65 0.22 180)', background: 'oklch(1 0 0)', text: 'oklch(0.269 0 0)', success: 'oklch(0.55 0.24 160)', warning: 'oklch(0.60 0.20 70)', error: 'oklch(0.50 0.22 25)' },
    },
    {
        id: 'green-nature', name: 'Yeşil Doğa',
        colors: { primary: 'oklch(0.55 0.24 160)', secondary: 'oklch(0.86 0.14 160)', accent: 'oklch(0.45 0.20 160)', background: 'oklch(0.97 0.06 160)', text: 'oklch(0.269 0 0)', success: 'oklch(0.55 0.24 160)', warning: 'oklch(0.68 0.18 70)', error: 'oklch(0.55 0.22 25)' },
    },
    {
        id: 'purple-creative', name: 'Mor Yaratıcı',
        colors: { primary: 'oklch(0.55 0.22 290)', secondary: 'oklch(0.86 0.12 290)', accent: 'oklch(0.76 0.16 290)', background: 'oklch(0.97 0.04 290)', text: 'oklch(0.269 0 0)', success: 'oklch(0.55 0.24 160)', warning: 'oklch(0.68 0.18 70)', error: 'oklch(0.55 0.22 25)' },
    },
];

// ── Page ─────────────────────────────────────────────────────────────────
export default function ThemeCustomizationPage() {
    const [colorsOverride, setColorsOverride] = useState<ThemeColors | null>(null);
    const [fontFamilyOverride, setFontFamilyOverride] = useState<string | null>(null);
    const [baseFontSizeOverride, setBaseFontSizeOverride] = useState<number | null>(null);
    const [headingFontOverride, setHeadingFontOverride] = useState<string | null>(null);
    const [lineHeightOverride, setLineHeightOverride] = useState<string | null>(null);
    const [sidebarWidthOverride, setSidebarWidthOverride] = useState<number | null>(null);
    const [borderRadiusOverride, setBorderRadiusOverride] = useState<string | null>(null);
    const [shadowStyleOverride, setShadowStyleOverride] = useState<string | null>(null);
    const [compactModeOverride, setCompactModeOverride] = useState<boolean | null>(null);
    const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const { data: settingsData } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    const themeSettings = (settingsData as AdminSettingsResponse | undefined)?.tenant?.settings?.theme;

    const colors = colorsOverride ?? themeSettings?.colors ?? DEFAULT_COLORS;
    const fontFamily = fontFamilyOverride ?? themeSettings?.fontFamily ?? 'inter';
    const baseFontSize = baseFontSizeOverride ?? themeSettings?.baseFontSize ?? 16;
    const headingFont = headingFontOverride ?? themeSettings?.headingFont ?? 'inter';
    const lineHeight = lineHeightOverride ?? themeSettings?.lineHeight ?? '1.5';
    const sidebarWidth = sidebarWidthOverride ?? themeSettings?.sidebarWidth ?? 260;
    const borderRadius = borderRadiusOverride ?? themeSettings?.borderRadius ?? 'medium';
    const shadowStyle = shadowStyleOverride ?? themeSettings?.shadowStyle ?? 'medium';
    const compactMode = compactModeOverride ?? themeSettings?.compactMode ?? false;

    const handleSaveTheme = async () => {
        try {
            await updateSettings.mutateAsync({
                theme: { colors, fontFamily, baseFontSize, headingFont, lineHeight, sidebarWidth, borderRadius, shadowStyle, compactMode },
            });
            toast.success('Tema ayarları kaydedildi');
        } catch {
            toast.error('Tema ayarları kaydedilemedi');
        }
    };

    const handleColorChange = (key: keyof ThemeColors, value: string) => {
        setColorsOverride({ ...colors, [key]: value });
        setActivePresetId(null);
    };

    const handleApplyPreset = (preset: PresetTheme) => {
        setColorsOverride({ ...preset.colors });
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setColorsOverride({ ...DEFAULT_COLORS });
        setFontFamilyOverride('inter');
        setBaseFontSizeOverride(16);
        setHeadingFontOverride('inter');
        setLineHeightOverride('1.5');
        setSidebarWidthOverride(260);
        setBorderRadiusOverride('medium');
        setShadowStyleOverride('medium');
        setCompactModeOverride(false);
        setActivePresetId('default');
    };

    return (
        <div className="space-y-6">
            {/* ── Kapsam Dışı Banner ── */}
            <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-warning-foreground">
                <span className="mt-0.5 text-lg">⚠️</span>
                <div className="text-sm">
                    <span className="font-semibold">Kapsam Dışı (MVP)</span>
                    <span className="ml-2 text-warning/80">— Site temaları site-engine tarafından AI ile üretilmektedir. Bu sayfa Phase-2 kapsamındadır.</span>
                </div>
            </div>

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tema Özelleştirme</h1>
                    <p className="text-muted-foreground">Uygulamanızın görünümünü ve hissini özelleştirin.</p>
                </div>
                <Button onClick={handleSaveTheme} disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? 'Kaydediliyor...' : 'Tema Ayarlarını Kaydet'}
                </Button>
            </div>

            {/* ── Preset Themes (top, visual) ── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>🎨 Hazır Temalar</CardTitle>
                    <CardDescription>Hızla bir tema seçin veya aşağıdan özelleştirin</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                        {PRESETS.map((preset) => {
                            const isActive = activePresetId === preset.id;
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => handleApplyPreset(preset)}
                                    className={`group relative rounded-xl border-2 p-3 text-left transition-all hover:shadow-md ${isActive ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-primary/30'}`}
                                    aria-label={`${preset.name} temasını uygula`}
                                >
                                    <div className="flex gap-1 mb-2">
                                        {[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.success].map((c, i) => (
                                            <div key={i} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <div
                                        className="h-8 w-full rounded-md mb-2"
                                        style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.accent})` }}
                                    />
                                    <p className="text-xs font-medium truncate">{preset.name}</p>
                                    {isActive && (
                                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* ── Color Palette ── */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" /> Renk Paleti
                                    </CardTitle>
                                    <CardDescription>Tema renklerini özelleştirin</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleReset}>
                                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Sıfırla
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {(Object.keys(colors) as (keyof ThemeColors)[]).map((key) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label htmlFor={key}>{COLOR_LABELS[key]}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={key}
                                                type="color"
                                                value={colors[key]}
                                                onChange={(e) => handleColorChange(key, e.target.value)}
                                                className="h-10 w-16 cursor-pointer p-1"
                                            />
                                            <Input
                                                value={colors[key]}
                                                onChange={(e) => handleColorChange(key, e.target.value)}
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Typography ── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Tipografi</CardTitle>
                            <CardDescription>Yazı tipi ayarlarını yapılandırın</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Yazı Tipi</Label>
                                    <Select value={fontFamily} onValueChange={setFontFamilyOverride}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Nunito'].map((f) => (
                                                <SelectItem key={f.toLowerCase().replace(' ', '-')} value={f.toLowerCase().replace(' ', '-')}>{f}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Temel Yazı Boyutu</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" min={12} max={20} value={baseFontSize} onChange={(e) => setBaseFontSizeOverride(Number(e.target.value))} />
                                        <span className="text-sm text-muted-foreground">px</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Başlık Yazı Tipi</Label>
                                    <Select value={headingFont} onValueChange={setHeadingFontOverride}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Nunito'].map((f) => (
                                                <SelectItem key={f.toLowerCase().replace(' ', '-')} value={f.toLowerCase().replace(' ', '-')}>{f}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Satır Yüksekliği</Label>
                                    <Select value={lineHeight} onValueChange={setLineHeightOverride}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1.25">Sıkı (1.25)</SelectItem>
                                            <SelectItem value="1.5">Normal (1.5)</SelectItem>
                                            <SelectItem value="1.75">Rahat (1.75)</SelectItem>
                                            <SelectItem value="2">Geniş (2)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Layout ── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" /> Düzen</CardTitle>
                            <CardDescription>Düzen ayarlarını yapılandırın</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Sidebar Genişliği</Label>
                                <div className="flex items-center gap-4">
                                    <Input type="range" min={200} max={320} value={sidebarWidth} onChange={(e) => setSidebarWidthOverride(Number(e.target.value))} className="flex-1" />
                                    <span className="w-16 text-sm text-muted-foreground">{sidebarWidth}px</span>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Köşe Yuvarlaklığı</Label>
                                    <Select value={borderRadius} onValueChange={setBorderRadiusOverride}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Yok</SelectItem>
                                            <SelectItem value="small">Küçük</SelectItem>
                                            <SelectItem value="medium">Orta</SelectItem>
                                            <SelectItem value="large">Büyük</SelectItem>
                                            <SelectItem value="full">Tam Yuvarlak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Gölge Stili</Label>
                                    <Select value={shadowStyle} onValueChange={setShadowStyleOverride}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Yok</SelectItem>
                                            <SelectItem value="light">Hafif</SelectItem>
                                            <SelectItem value="medium">Orta</SelectItem>
                                            <SelectItem value="strong">Güçlü</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="compactMode">Kompakt Mod</Label>
                                    <p className="text-xs text-muted-foreground">Daha sıkı aralıklar ve küçük bileşenler</p>
                                </div>
                                <Switch id="compactMode" checked={compactMode} onCheckedChange={setCompactModeOverride} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Preview (sticky) ── */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Önizleme</CardTitle>
                                <div className="flex gap-1 rounded-md border p-0.5">
                                    <Button variant={previewMode === 'light' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewMode('light')} className="h-6 px-2 text-xs">Açık</Button>
                                    <Button variant={previewMode === 'dark' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewMode('dark')} className="h-6 px-2 text-xs">Koyu</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="space-y-4 rounded-lg border p-4"
                                style={{
                                    backgroundColor: previewMode === 'dark' ? '#0f172a' : colors.background,
                                    color: previewMode === 'dark' ? '#f1f5f9' : colors.text,
                                }}
                            >
                                <div>
                                    <h3 className="text-lg font-semibold">Örnek Başlık</h3>
                                    <p className="text-sm opacity-80">Bu bir örnek metin paragrafıdır. Tema ayarlarınızın nasıl göründüğünü gösterir.</p>
                                </div>

                                <div className="flex gap-2">
                                    <button className="rounded px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: colors.primary }}>
                                        Ana Buton
                                    </button>
                                    <button className="rounded border px-3 py-1.5 text-sm font-medium" style={{ borderColor: colors.primary, color: colors.primary }}>
                                        İkincil
                                    </button>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { label: 'Başarılı', bg: colors.success },
                                        { label: 'Uyarı', bg: colors.warning },
                                        { label: 'Hata', bg: colors.error },
                                    ].map((badge) => (
                                        <span key={badge.label} className="rounded px-2 py-1 text-xs font-medium text-white" style={{ backgroundColor: badge.bg }}>
                                            {badge.label}
                                        </span>
                                    ))}
                                </div>

                                <div className="rounded border p-3" style={{ borderColor: previewMode === 'dark' ? '#334155' : '#e2e8f0' }}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium">Örnek Kart</span>
                                        <Badge>Yeni</Badge>
                                    </div>
                                    <p className="text-xs opacity-70">Kart içeriği burada görünür</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="h-2 w-full rounded-full" style={{ backgroundColor: previewMode === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                                        <div className="h-2 rounded-full" style={{ backgroundColor: colors.primary, width: '60%' }} />
                                    </div>
                                    <p className="text-xs opacity-70">İlerleme Çubuğu</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
