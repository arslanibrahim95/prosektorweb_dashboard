'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ChevronLeft,
    Eye,
    Save,
    Send,
    Undo,
    Redo,
    Smartphone,
    Tablet,
    Monitor,
    Type,
    Image,
    LayoutGrid,
    MessageSquare,
    Star,
    Users,
    HelpCircle,
    Map,
    Minus,
    GripVertical,
} from 'lucide-react';
import Link from 'next/link';

const blockTypes = [
    { id: 'hero', label: 'Hero', icon: LayoutGrid },
    { id: 'text', label: 'Metin', icon: Type },
    { id: 'image', label: 'Görsel', icon: Image },
    { id: 'features', label: 'Özellikler', icon: Star },
    { id: 'testimonials', label: 'Referanslar', icon: MessageSquare },
    { id: 'team', label: 'Ekip', icon: Users },
    { id: 'faq', label: 'SSS', icon: HelpCircle },
    { id: 'map', label: 'Harita', icon: Map },
    { id: 'divider', label: 'Ayırıcı', icon: Minus },
];

const mockBlocks = [
    { id: '1', type: 'hero', title: 'Hero Bölümü' },
    { id: '2', type: 'features', title: 'Hizmetlerimiz' },
    { id: '3', type: 'testimonials', title: 'Müşteri Yorumları' },
];

export default function SiteBuilderPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
            {/* Top Bar */}
            <div className="h-14 border-b bg-white flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/site/pages">
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Sayfalar
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <span className="font-medium">Anasayfa</span>
                    <Badge variant="secondary">Taslak</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Redo className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Önizle
                    </Button>
                    <Button variant="outline" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Kaydet
                    </Button>
                    <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Yayınla
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Block Picker - Left Panel */}
                <div className="w-64 border-r bg-white">
                    <div className="p-4 border-b">
                        <h3 className="font-medium text-sm">Bloklar</h3>
                        <p className="text-xs text-gray-500 mt-1">Sürükle bırak ile ekle</p>
                    </div>
                    <ScrollArea className="h-[calc(100%-4rem)]">
                        <div className="p-4 grid grid-cols-2 gap-2">
                            {blockTypes.map((block) => (
                                <div
                                    key={block.id}
                                    className="p-3 border rounded-lg text-center cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                >
                                    <block.icon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                                    <span className="text-xs text-gray-700">{block.label}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Canvas - Center */}
                <div className="flex-1 bg-gray-100 p-8 overflow-auto">
                    {/* Responsive Preview Toggle */}
                    <div className="flex justify-center gap-2 mb-6">
                        <Button variant="outline" size="sm" className="bg-white">
                            <Monitor className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Tablet className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Smartphone className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Canvas Area */}
                    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm min-h-[600px]">
                        <div className="p-4 space-y-4">
                            {mockBlocks.map((block) => (
                                <Card
                                    key={block.id}
                                    className="p-8 border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                            <GripVertical className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{block.title}</p>
                                            <p className="text-xs text-gray-400">Tıklayarak düzenle</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {/* Add Block Placeholder */}
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 hover:border-blue-300 hover:text-blue-500 cursor-pointer transition-colors">
                                <p className="text-sm">Blok sürükleyip bırakın veya tıklayın</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inspector - Right Panel */}
                <div className="w-80 border-l bg-white">
                    <div className="p-4 border-b">
                        <h3 className="font-medium text-sm">Blok Ayarları</h3>
                        <p className="text-xs text-gray-500 mt-1">Düzenlemek için bir blok seçin</p>
                    </div>
                    <div className="p-4">
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            <p className="text-sm text-center">
                                Düzenlemek için sol taraftaki<br />bloklerden birini seçin
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="h-10 border-t bg-white flex items-center justify-between px-4 text-sm text-gray-500">
                <span>Taslak otomatik kaydedildi - 2 dakika önce</span>
                <span>3 revizyon mevcut</span>
            </div>
        </div>
    );
}
