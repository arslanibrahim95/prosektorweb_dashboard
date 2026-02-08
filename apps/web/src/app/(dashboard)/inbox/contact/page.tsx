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
import { Search, Calendar, Mail, Phone, MessageSquare, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Mock data
const mockMessages = [
    {
        id: '1',
        full_name: 'Fatma Öztürk',
        email: 'fatma@email.com',
        phone: '+90 535 444 5566',
        subject: 'Randevu talebi',
        message: 'Merhaba, çalışanlarımız için sağlık taraması randevusu almak istiyoruz. En yakın zamanda bizi arayabilir misiniz?',
        is_read: false,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        full_name: 'Ali Veli',
        email: 'ali@sirket.com',
        phone: '+90 536 777 8899',
        subject: 'Hizmet hakkında soru',
        message: 'İş güvenliği eğitimi online olarak verilebiliyor mu?',
        is_read: true,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        full_name: 'Elif Yıldız',
        email: 'elif@abc.com',
        phone: '+90 537 222 3344',
        subject: 'Şikayet',
        message: 'Geçen hafta randevumuza kimse gelmedi. Lütfen konu hakkında bilgi verin.',
        is_read: false,
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
];

type ContactMessage = typeof mockMessages[number];

export default function ContactInboxPage() {
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [isLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMessages = mockMessages.filter(msg =>
        msg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <h1 className="text-2xl font-bold">İletişim Mesajları</h1>
                <TableSkeleton columns={5} rows={5} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">İletişim Mesajları</h1>
                    <p className="text-gray-500">Gelen iletişim formu mesajları</p>
                </div>
                <Badge variant="secondary">
                    {mockMessages.filter(m => !m.is_read).length} okunmamış
                </Badge>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="İsim, email veya konu ara..."
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
            {filteredMessages.length === 0 ? (
                <EmptyState
                    icon={<MessageSquare className="h-12 w-12" />}
                    title="Henüz mesaj yok"
                    description="Sitenizde iletişim formu dolduran kişiler burada görüntülenecek."
                    action={{
                        label: 'İletişim Modülünü Ayarla',
                        onClick: () => window.location.href = '/modules/contact',
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
                                <TableHead>Konu</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[100px]">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMessages.map((message) => (
                                <TableRow
                                    key={message.id}
                                    className={`cursor-pointer hover:bg-gray-50 ${!message.is_read ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => setSelectedMessage(message)}
                                >
                                    <TableCell>
                                        {!message.is_read && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {formatRelativeTime(message.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">{message.full_name}</TableCell>
                                    <TableCell>{message.subject || '-'}</TableCell>
                                    <TableCell>{message.email}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMessage(message);
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
            <Sheet open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
                <SheetContent className="sm:max-w-lg">
                    {selectedMessage && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedMessage.full_name}</SheetTitle>
                                <SheetDescription>
                                    {formatDate(selectedMessage.created_at)}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                {/* Subject */}
                                {selectedMessage.subject && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-1">Konu</h4>
                                        <p className="text-sm text-gray-600">{selectedMessage.subject}</p>
                                    </div>
                                )}

                                {/* Contact Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                                            {selectedMessage.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <a href={`tel:${selectedMessage.phone}`} className="text-blue-600 hover:underline">
                                            {selectedMessage.phone}
                                        </a>
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Mesaj</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button className="flex-1" asChild>
                                        <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'İletişim'}`}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Yanıtla
                                        </a>
                                    </Button>
                                    <Button variant="outline" className="flex-1" asChild>
                                        <a href={`tel:${selectedMessage.phone}`}>
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
