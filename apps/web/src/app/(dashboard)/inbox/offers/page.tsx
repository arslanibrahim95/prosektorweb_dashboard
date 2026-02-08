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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { EmptyState, TableSkeleton } from '@/components/layout';
import { Search, Calendar, Mail, Phone, Building, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Mock data
const mockOffers = [
    {
        id: '1',
        full_name: 'Ahmet Yılmaz',
        email: 'ahmet@firma.com',
        phone: '+90 532 123 4567',
        company_name: 'ABC Holding',
        message: 'OSGB hizmetleriniz hakkında bilgi almak istiyorum. 200 çalışanımız için fiyat teklifi alabilir miyiz?',
        source: { page_url: '/hizmetler' },
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        full_name: 'Mehmet Kaya',
        email: 'mehmet@xyz.com',
        phone: '+90 533 987 6543',
        company_name: 'XYZ Ltd.',
        message: 'İş sağlığı ve güvenliği eğitimi için teklif rica ediyoruz.',
        source: { page_url: '/' },
        is_read: true,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        full_name: 'Zeynep Demir',
        email: 'zeynep@demir.co',
        phone: '+90 534 111 2233',
        company_name: 'Demir İnşaat',
        message: 'Şantiye için iş güvenliği hizmetleri almak istiyoruz. Acil olarak görüşebilir miyiz?',
        source: { page_url: '/iletisim' },
        is_read: false,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
];

type OfferRequest = typeof mockOffers[number];

export default function OffersInboxPage() {
    const [selectedOffer, setSelectedOffer] = useState<OfferRequest | null>(null);
    const [isLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOffers = mockOffers.filter(offer =>
        offer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'd MMM yyyy, HH:mm', { locale: tr });
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} gün önce`;
        if (hours > 0) return `${hours} saat önce`;
        return 'Az önce';
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Teklifler</h1>
                <TableSkeleton columns={6} rows={5} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Teklifler</h1>
                    <p className="text-gray-500">Gelen teklif talepleri</p>
                </div>
                <Badge variant="secondary">
                    {mockOffers.filter(o => !o.is_read).length} okunmamış
                </Badge>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="İsim, email veya firma ara..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Tarih Filtresi
                </Button>
            </div>

            {/* Table */}
            {filteredOffers.length === 0 ? (
                <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="Henüz teklif talebi yok"
                    description="Sitenizde teklif formu dolduran kişiler burada görüntülenecek."
                    action={{
                        label: 'Teklif Modülünü Ayarla',
                        onClick: () => window.location.href = '/modules/offer',
                    }}
                />
            ) : (
                <div className="rounded-lg border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Ad Soyad</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>Firma</TableHead>
                                <TableHead className="w-[100px]">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOffers.map((offer) => (
                                <TableRow
                                    key={offer.id}
                                    className={`cursor-pointer hover:bg-gray-50 ${!offer.is_read ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => setSelectedOffer(offer)}
                                >
                                    <TableCell>
                                        {!offer.is_read && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {formatRelativeTime(offer.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">{offer.full_name}</TableCell>
                                    <TableCell>{offer.email}</TableCell>
                                    <TableCell>{offer.phone}</TableCell>
                                    <TableCell>{offer.company_name || '-'}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOffer(offer);
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Detail Drawer */}
            <Sheet open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
                <SheetContent className="sm:max-w-lg">
                    {selectedOffer && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedOffer.full_name}</SheetTitle>
                                <SheetDescription>
                                    {formatDate(selectedOffer.created_at)}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                {/* Contact Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <a href={`mailto:${selectedOffer.email}`} className="text-blue-600 hover:underline">
                                            {selectedOffer.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <a href={`tel:${selectedOffer.phone}`} className="text-blue-600 hover:underline">
                                            {selectedOffer.phone}
                                        </a>
                                    </div>
                                    {selectedOffer.company_name && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <span>{selectedOffer.company_name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Message */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Mesaj</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                                        {selectedOffer.message || 'Mesaj yok'}
                                    </p>
                                </div>

                                {/* Source */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Kaynak Sayfa</h4>
                                    <Badge variant="outline">
                                        {selectedOffer.source.page_url}
                                    </Badge>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button className="flex-1" asChild>
                                        <a href={`mailto:${selectedOffer.email}`}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Email Gönder
                                        </a>
                                    </Button>
                                    <Button variant="outline" className="flex-1" asChild>
                                        <a href={`tel:${selectedOffer.phone}`}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Ara
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
