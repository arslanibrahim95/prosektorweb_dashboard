'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, ChevronRight, ExternalLink, Edit2, Trash2 } from 'lucide-react';

// Mock data
const mockMenus = [
    {
        id: '1',
        name: 'Ana Menü',
        location: 'header',
        items: [
            { id: '1', label: 'Anasayfa', href: '/' },
            { id: '2', label: 'Hakkımızda', href: '/hakkimizda' },
            {
                id: '3', label: 'Hizmetler', href: '/hizmetler', children: [
                    { id: '3.1', label: 'OSGB Hizmeti', href: '/hizmetler/osgb' },
                    { id: '3.2', label: 'Eğitim', href: '/hizmetler/egitim' },
                ]
            },
            { id: '4', label: 'İletişim', href: '/iletisim' },
        ],
    },
    {
        id: '2',
        name: 'Footer Menü',
        location: 'footer',
        items: [
            { id: '1', label: 'Gizlilik Politikası', href: '/gizlilik' },
            { id: '2', label: 'Kullanım Şartları', href: '/kullanim-sartlari' },
        ],
    },
];

interface MenuItem {
    id: string;
    label: string;
    href: string;
    children?: MenuItem[];
}

function MenuItemTree({ items, depth = 0 }: { items: MenuItem[]; depth?: number }) {
    return (
        <div className={`space-y-1 ${depth > 0 ? 'ml-6 border-l pl-4' : ''}`}>
            {items.map((item) => (
                <div key={item.id}>
                    <div className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 group">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                        <span className="flex-1 text-sm">{item.label}</span>
                        <span className="text-xs text-gray-400">{item.href}</span>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                            <Edit2 className="h-3 w-3" />
                        </Button>
                    </div>
                    {item.children && <MenuItemTree items={item.children} depth={depth + 1} />}
                </div>
            ))}
        </div>
    );
}

export default function MenusPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Menüler</h1>
                    <p className="text-gray-500">Site navigasyonunu yönetin</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Menü
                </Button>
            </div>

            {/* Menu Cards */}
            <div className="space-y-6">
                {mockMenus.map((menu) => (
                    <Card key={menu.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                                    <CardDescription>
                                        Konum: <Badge variant="outline">{menu.location}</Badge>
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Öğe Ekle
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <MenuItemTree items={menu.items} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
