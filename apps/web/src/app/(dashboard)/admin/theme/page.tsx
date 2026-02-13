"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Palette, Type, Layout, Eye, RotateCcw } from "lucide-react";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/use-admin";
import { toast } from "sonner";

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

const presetThemes: PresetTheme[] = [
    {
        id: "default",
        name: "Varsayılan",
        colors: {
            primary: "#3b82f6",
            secondary: "#64748b",
            accent: "#8b5cf6",
            background: "#ffffff",
            text: "#0f172a",
            success: "#10b981",
            warning: "#f59e0b",
            error: "#ef4444",
        },
    },
    {
        id: "dark-professional",
        name: "Koyu Profesyonel",
        colors: {
            primary: "#60a5fa",
            secondary: "#94a3b8",
            accent: "#a78bfa",
            background: "#0f172a",
            text: "#f1f5f9",
            success: "#34d399",
            warning: "#fbbf24",
            error: "#f87171",
        },
    },
    {
        id: "light-minimal",
        name: "Açık Minimal",
        colors: {
            primary: "#6366f1",
            secondary: "#9ca3af",
            accent: "#ec4899",
            background: "#f9fafb",
            text: "#111827",
            success: "#059669",
            warning: "#d97706",
            error: "#dc2626",
        },
    },
    {
        id: "blue-corporate",
        name: "Mavi Kurumsal",
        colors: {
            primary: "#0ea5e9",
            secondary: "#475569",
            accent: "#06b6d4",
            background: "#ffffff",
            text: "#1e293b",
            success: "#14b8a6",
            warning: "#f97316",
            error: "#e11d48",
        },
    },
    {
        id: "green-nature",
        name: "Yeşil Doğa",
        colors: {
            primary: "#22c55e",
            secondary: "#84cc16",
            accent: "#10b981",
            background: "#f0fdf4",
            text: "#14532d",
            success: "#16a34a",
            warning: "#eab308",
            error: "#dc2626",
        },
    },
    {
        id: "purple-creative",
        name: "Mor Yaratıcı",
        colors: {
            primary: "#a855f7",
            secondary: "#c084fc",
            accent: "#d946ef",
            background: "#faf5ff",
            text: "#581c87",
            success: "#10b981",
            warning: "#f59e0b",
            error: "#f43f5e",
        },
    },
];

export default function ThemeCustomizationPage() {
    const [colors, setColors] = useState<ThemeColors>(presetThemes[0].colors);
    const [fontFamily, setFontFamily] = useState("inter");
    const [baseFontSize, setBaseFontSize] = useState(16);
    const [headingFont, setHeadingFont] = useState("inter");
    const [lineHeight, setLineHeight] = useState("1.5");
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [borderRadius, setBorderRadius] = useState("medium");
    const [shadowStyle, setShadowStyle] = useState("medium");
    const [compactMode, setCompactMode] = useState(false);
    const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

    const { data: settingsData, isLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    const handleColorChange = (key: keyof ThemeColors, value: string) => {
        setColors({ ...colors, [key]: value });
    };

    const handleApplyPreset = (preset: PresetTheme) => {
        setColors(preset.colors);
    };

    const handleReset = () => {
        setColors(presetThemes[0].colors);
        setFontFamily("inter");
        setBaseFontSize(16);
        setHeadingFont("inter");
        setLineHeight("1.5");
        setSidebarWidth(260);
        setBorderRadius("medium");
        setShadowStyle("medium");
        setCompactMode(false);
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Tema Özelleştirme"
                description="Uygulamanızın görünümünü ve hissini özelleştirin"
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Color Palette */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        Renk Paleti
                                    </CardTitle>
                                    <CardDescription>Tema renklerini özelleştirin</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleReset}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Varsayılana Sıfırla
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {Object.entries(colors).map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={key} className="capitalize">
                                            {key === "primary" && "Ana Renk"}
                                            {key === "secondary" && "İkincil Renk"}
                                            {key === "accent" && "Vurgu Rengi"}
                                            {key === "background" && "Arka Plan"}
                                            {key === "text" && "Metin Rengi"}
                                            {key === "success" && "Başarı"}
                                            {key === "warning" && "Uyarı"}
                                            {key === "error" && "Hata"}
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={key}
                                                type="color"
                                                value={value}
                                                onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                                                className="h-10 w-20 cursor-pointer"
                                            />
                                            <Input
                                                value={value}
                                                onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Typography */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Type className="h-5 w-5" />
                                Tipografi
                            </CardTitle>
                            <CardDescription>Yazı tipi ayarlarını yapılandırın</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fontFamily">Yazı Tipi</Label>
                                    <Select value={fontFamily} onValueChange={setFontFamily}>
                                        <SelectTrigger id="fontFamily">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inter">Inter</SelectItem>
                                            <SelectItem value="roboto">Roboto</SelectItem>
                                            <SelectItem value="open-sans">Open Sans</SelectItem>
                                            <SelectItem value="poppins">Poppins</SelectItem>
                                            <SelectItem value="nunito">Nunito</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="baseFontSize">Temel Yazı Boyutu</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="baseFontSize"
                                            type="number"
                                            min={12}
                                            max={20}
                                            value={baseFontSize}
                                            onChange={(e) => setBaseFontSize(Number(e.target.value))}
                                        />
                                        <span className="text-sm text-muted-foreground">px</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="headingFont">Başlık Yazı Tipi</Label>
                                    <Select value={headingFont} onValueChange={setHeadingFont}>
                                        <SelectTrigger id="headingFont">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inter">Inter</SelectItem>
                                            <SelectItem value="roboto">Roboto</SelectItem>
                                            <SelectItem value="open-sans">Open Sans</SelectItem>
                                            <SelectItem value="poppins">Poppins</SelectItem>
                                            <SelectItem value="nunito">Nunito</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lineHeight">Satır Yüksekliği</Label>
                                    <Select value={lineHeight} onValueChange={setLineHeight}>
                                        <SelectTrigger id="lineHeight">
                                            <SelectValue />
                                        </SelectTrigger>
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

                    {/* Layout */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layout className="h-5 w-5" />
                                Düzen
                            </CardTitle>
                            <CardDescription>Düzen ayarlarını yapılandırın</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sidebarWidth">Sidebar Genişliği</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="sidebarWidth"
                                            type="range"
                                            min={200}
                                            max={320}
                                            value={sidebarWidth}
                                            onChange={(e) => setSidebarWidth(Number(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="w-16 text-sm text-muted-foreground">
                                            {sidebarWidth}px
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="borderRadius">Köşe Yuvarlaklığı</Label>
                                        <Select value={borderRadius} onValueChange={setBorderRadius}>
                                            <SelectTrigger id="borderRadius">
                                                <SelectValue />
                                            </SelectTrigger>
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
                                        <Label htmlFor="shadowStyle">Gölge Stili</Label>
                                        <Select value={shadowStyle} onValueChange={setShadowStyle}>
                                            <SelectTrigger id="shadowStyle">
                                                <SelectValue />
                                            </SelectTrigger>
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
                                    <div className="space-y-0.5">
                                        <Label htmlFor="compactMode">Kompakt Mod</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Daha sıkı aralıklar ve daha küçük bileşenler
                                        </p>
                                    </div>
                                    <Switch
                                        id="compactMode"
                                        checked={compactMode}
                                        onCheckedChange={setCompactMode}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preset Themes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hazır Temalar</CardTitle>
                            <CardDescription>
                                Önceden tanımlanmış temalardan birini seçin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {presetThemes.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handleApplyPreset(preset)}
                                        className="group relative overflow-hidden rounded-lg border p-4 text-left transition-all hover:border-primary hover:shadow-md"
                                    >
                                        <div className="mb-3 flex gap-1">
                                            <div
                                                className="h-6 w-6 rounded"
                                                style={{ backgroundColor: preset.colors.primary }}
                                            />
                                            <div
                                                className="h-6 w-6 rounded"
                                                style={{ backgroundColor: preset.colors.secondary }}
                                            />
                                            <div
                                                className="h-6 w-6 rounded"
                                                style={{ backgroundColor: preset.colors.accent }}
                                            />
                                        </div>
                                        <h4 className="font-medium">{preset.name}</h4>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="h-5 w-5" />
                                    Önizleme
                                </CardTitle>
                                <div className="flex gap-1 rounded-md border p-1">
                                    <Button
                                        variant={previewMode === "light" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setPreviewMode("light")}
                                        className="h-7 px-2"
                                    >
                                        Açık
                                    </Button>
                                    <Button
                                        variant={previewMode === "dark" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setPreviewMode("dark")}
                                        className="h-7 px-2"
                                    >
                                        Koyu
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="space-y-4 rounded-lg border p-4"
                                style={{
                                    backgroundColor: previewMode === "dark" ? "#0f172a" : colors.background,
                                    color: previewMode === "dark" ? "#f1f5f9" : colors.text,
                                }}
                            >
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">Örnek Başlık</h3>
                                    <p className="text-sm opacity-80">
                                        Bu bir örnek metin paragrafıdır. Tema ayarlarınızın nasıl göründüğünü
                                        gösterir.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        className="rounded px-3 py-1.5 text-sm font-medium text-white"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                        Ana Buton
                                    </button>
                                    <button
                                        className="rounded border px-3 py-1.5 text-sm font-medium"
                                        style={{
                                            borderColor: colors.primary,
                                            color: colors.primary,
                                        }}
                                    >
                                        İkincil
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <span
                                        className="rounded px-2 py-1 text-xs font-medium text-white"
                                        style={{ backgroundColor: colors.success }}
                                    >
                                        Başarılı
                                    </span>
                                    <span
                                        className="rounded px-2 py-1 text-xs font-medium text-white"
                                        style={{ backgroundColor: colors.warning }}
                                    >
                                        Uyarı
                                    </span>
                                    <span
                                        className="rounded px-2 py-1 text-xs font-medium text-white"
                                        style={{ backgroundColor: colors.error }}
                                    >
                                        Hata
                                    </span>
                                </div>

                                <div
                                    className="rounded border p-3"
                                    style={{
                                        borderColor: previewMode === "dark" ? "#334155" : "#e2e8f0",
                                    }}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium">Örnek Kart</span>
                                        <Badge>Yeni</Badge>
                                    </div>
                                    <p className="text-xs opacity-70">
                                        Kart içeriği burada görünür
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div
                                        className="h-2 w-full rounded-full"
                                        style={{ backgroundColor: previewMode === "dark" ? "#1e293b" : "#e2e8f0" }}
                                    >
                                        <div
                                            className="h-2 rounded-full"
                                            style={{ backgroundColor: colors.primary, width: "60%" }}
                                        />
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
