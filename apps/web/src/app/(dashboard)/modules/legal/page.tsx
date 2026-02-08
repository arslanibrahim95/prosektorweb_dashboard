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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Mock data
const mockLegalTexts = [
    {
        id: '1',
        title: 'KVKK Aydınlatma Metni - v1',
        type: 'kvkk',
        version: 1,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        title: 'KVKK Açık Rıza - v1',
        type: 'consent',
        version: 1,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        title: 'Kullanım Şartları - v2',
        type: 'terms',
        version: 2,
        is_active: true,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

const typeLabels: Record<string, string> = {
    kvkk: 'KVKK',
    consent: 'Açık Rıza',
    terms: 'Kullanım Şartları',
    privacy: 'Gizlilik',
};

export default function LegalTextsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'kvkk',
        content: '',
    });

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'd MMM yyyy', { locale: tr });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Yasal Metinler</h1>
                    <p className="text-gray-500">KVKK ve yasal metin şablonlarını yönetin</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Metin
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Yasal Metin Oluştur</DialogTitle>
                            <DialogDescription>
                                Formlarda kullanılacak yasal metin oluşturun
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Başlık</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="KVKK Aydınlatma Metni"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Metin Tipi</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kvkk">KVKK Aydınlatma</SelectItem>
                                        <SelectItem value="consent">Açık Rıza</SelectItem>
                                        <SelectItem value="terms">Kullanım Şartları</SelectItem>
                                        <SelectItem value="privacy">Gizlilik Politikası</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">İçerik</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Yasal metin içeriği..."
                                    rows={10}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                            <Button onClick={() => setIsDialogOpen(false)}>Kaydet</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            {mockLegalTexts.length === 0 ? (
                <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="Henüz yasal metin yok"
                    description="KVKK ve diğer yasal metinlerinizi buradan yönetin."
                    action={{
                        label: 'İlk Metni Oluştur',
                        onClick: () => setIsDialogOpen(true),
                    }}
                />
            ) : (
                <div className="rounded-lg border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Başlık</TableHead>
                                <TableHead>Tip</TableHead>
                                <TableHead>Versiyon</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Oluşturulma</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockLegalTexts.map((text) => (
                                <TableRow key={text.id}>
                                    <TableCell className="font-medium">{text.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{typeLabels[text.type]}</Badge>
                                    </TableCell>
                                    <TableCell>v{text.version}</TableCell>
                                    <TableCell>
                                        {text.is_active ? (
                                            <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                                        ) : (
                                            <Badge variant="secondary">Pasif</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {formatDate(text.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Yeni Versiyon
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
