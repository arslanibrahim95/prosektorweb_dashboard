'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/layout';
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Copy,
    Trash2,
    FileText,
    GripVertical,
    ExternalLink,
    Search,
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const mockPages = [
    { id: '1', title: 'Anasayfa', slug: '', status: 'published', order_index: 0 },
    { id: '2', title: 'Hakkımızda', slug: 'hakkimizda', status: 'published', order_index: 1 },
    { id: '3', title: 'Hizmetler', slug: 'hizmetler', status: 'draft', order_index: 2 },
    { id: '4', title: 'İletişim', slug: 'iletisim', status: 'published', order_index: 3 },
    { id: '5', title: 'Kariyer', slug: 'kariyer', status: 'published', order_index: 4 },
];

export default function SitePagesPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPages = mockPages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sayfalar</h1>
                    <p className="text-gray-500">Sitenizin sayfalarını yönetin</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Sayfa
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Sayfa ara..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Table */}
            {filteredPages.length === 0 ? (
                <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="Henüz sayfa yok"
                    description="İlk sayfanızı oluşturarak sitenizi kurmaya başlayın."
                    action={{
                        label: 'İlk Sayfayı Oluştur',
                        onClick: () => { },
                    }}
                />
            ) : (
                <div className="rounded-lg border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Sayfa</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPages.map((page) => (
                                <TableRow key={page.id}>
                                    <TableCell>
                                        <button className="cursor-grab text-gray-400 hover:text-gray-600">
                                            <GripVertical className="h-4 w-4" />
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/site/builder?page=${page.id}`}
                                            className="font-medium hover:text-blue-600"
                                        >
                                            {page.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-gray-500">
                                        /{page.slug}
                                    </TableCell>
                                    <TableCell>
                                        {page.status === 'published' ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                Yayında
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Taslak</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/site/builder?page=${page.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        Önizle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Kopyala
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
