'use client';

import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Copy, Send, Trash2 } from 'lucide-react';
import { NotificationTemplate } from './types';
import { cn } from '@/lib/utils';
import React from 'react';

interface TemplatesTabProps {
    templates: NotificationTemplate[];
    handleCreateTemplate: () => void;
    handleEditTemplate: (template: NotificationTemplate) => void;
    handleCopyTemplate: (template: NotificationTemplate) => void;
    handleTestSend: (template: NotificationTemplate) => void;
    handleDeleteTemplate: (template: NotificationTemplate) => void;
    formatDate: (dateString: string) => string;
}

const typeColors: Record<string, string> = {
    email: 'bg-info/10 text-info',
    sms: 'bg-success/10 text-success',
    push: 'bg-violet/10 text-violet',
    in_app: 'bg-warning/10 text-warning',
};

const typeLabels: Record<string, string> = {
    email: 'E-posta',
    sms: 'SMS',
    push: 'Push',
    in_app: 'Uygulama İçi',
};

export function TemplatesTab({
    templates,
    handleCreateTemplate,
    handleEditTemplate,
    handleCopyTemplate,
    handleTestSend,
    handleDeleteTemplate,
    formatDate,
}: TemplatesTabProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {templates.length} şablon
                </div>
                <Button onClick={handleCreateTemplate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Şablon
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Şablon Adı</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Tetikleyici Olay</TableHead>
                                <TableHead>Son Güncelleme</TableHead>
                                <TableHead className="w-[70px]">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">
                                        {template.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={cn(typeColors[template.type])}
                                        >
                                            {typeLabels[template.type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={template.is_active ? 'default' : 'secondary'}
                                        >
                                            {template.is_active ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {template.trigger_label}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(template.updated_at)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleEditTemplate(template)}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleCopyTemplate(template)}
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Kopyala
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleTestSend(template)}
                                                >
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Test Gönder
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteTemplate(template)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {templates.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                        Kayıtlı şablon bulunmuyor
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
