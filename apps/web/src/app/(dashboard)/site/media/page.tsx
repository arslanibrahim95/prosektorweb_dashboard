'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/layout';
import {
    Plus,
    Search,
    Grid3X3,
    List,
    MoreHorizontal,
    Image,
    Trash2,
    Download,
    Copy,
} from 'lucide-react';

// Mock data
const mockMedia = [
    { id: '1', name: 'hero-image.jpg', type: 'image', size: '2.3 MB', url: '/images/hero.jpg' },
    { id: '2', name: 'logo.png', type: 'image', size: '45 KB', url: '/images/logo.png' },
    { id: '3', name: 'team-photo.jpg', type: 'image', size: '1.8 MB', url: '/images/team.jpg' },
    { id: '4', name: 'about-bg.jpg', type: 'image', size: '3.1 MB', url: '/images/about-bg.jpg' },
    { id: '5', name: 'service-1.png', type: 'image', size: '890 KB', url: '/images/service-1.png' },
    { id: '6', name: 'icon-safety.svg', type: 'image', size: '12 KB', url: '/images/icon.svg' },
];

export default function MediaPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredMedia = mockMedia.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Medya Kütüphanesi</h1>
                    <p className="text-gray-500">Görseller ve dosyaları yönetin</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Dosya Yükle
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Dosya ara..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Media Grid */}
            {filteredMedia.length === 0 ? (
                <EmptyState
                    icon={<Image className="h-12 w-12" />}
                    title="Henüz dosya yok"
                    description="İlk dosyanızı yükleyerek başlayın."
                    action={{
                        label: 'Dosya Yükle',
                        onClick: () => { },
                    }}
                />
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredMedia.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-square rounded-lg border bg-gray-100 overflow-hidden hover:ring-2 hover:ring-blue-500 cursor-pointer"
                        >
                            {/* Placeholder for image */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <Image className="h-8 w-8" />
                            </div>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <div className="flex-1">
                                    <p className="text-white text-xs truncate">{item.name}</p>
                                    <p className="text-white/70 text-xs">{item.size}</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Copy className="mr-2 h-4 w-4" />
                                            URL Kopyala
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Download className="mr-2 h-4 w-4" />
                                            İndir
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Sil
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border bg-white divide-y">
                    {filteredMedia.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                            <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
                                <Image className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.size}</p>
                            </div>
                            <Badge variant="outline">{item.type}</Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Copy className="mr-2 h-4 w-4" />
                                        URL Kopyala
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Download className="mr-2 h-4 w-4" />
                                        İndir
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Sil
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
