'use client';

import { useState } from 'react';
import { IpBlockDialog } from '@/features/admin/components/ip-block-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
    useAdminSettings,
    useUpdateAdminSettings,
    useAdminIpBlocks,
    useCreateIpBlock,
    useUpdateIpBlock,
    useDeleteIpBlock,
} from '@/hooks/use-admin';
import { toast } from 'sonner';
import { formatDate, getBlockedUntil } from '../utils/security-helpers';
import type {
    IpBlockRecord,
    IpBlockFormData,
    AdminIpBlocksResponse,
    AdminSettingsResponse,
    SecuritySettingsPayload,
} from '../types/security';

export function IpBlocksPanel() {
    const [ipBlockDialogOpen, setIpBlockDialogOpen] = useState(false);
    const [selectedIpBlock, setSelectedIpBlock] = useState<{
        id: string;
        ip_address: string;
        reason: string;
        duration: '1h' | '24h' | '7d' | '30d' | 'permanent';
        type: 'block' | 'allow';
    } | null>(null);
    const [autoBlockSettings, setAutoBlockSettings] = useState({
        failedLoginLimit: 5,
        blockDuration: '24h',
    });

    const { data: settingsData, isLoading: settingsLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();
    const { data: ipBlocksData } = useAdminIpBlocks();
    const createIpBlock = useCreateIpBlock();
    const updateIpBlock = useUpdateIpBlock();
    const deleteIpBlock = useDeleteIpBlock();

    const securitySettings: SecuritySettingsPayload =
        (settingsData as AdminSettingsResponse | undefined)?.tenant?.settings?.security ?? {};
    const blockedIPs = (ipBlocksData as AdminIpBlocksResponse | undefined)?.items ?? [];

    const handleAddIpBlock = () => {
        setSelectedIpBlock(null);
        setIpBlockDialogOpen(true);
    };

    const handleEditIpBlock = (ipBlock: IpBlockRecord) => {
        setSelectedIpBlock({
            id: ipBlock.id,
            ip_address: ipBlock.ip_address,
            reason: ipBlock.reason ?? '',
            duration: '24h' as const,
            type: 'block' as const,
        });
        setIpBlockDialogOpen(true);
    };

    const handleDeleteIpBlock = async (ipBlock: IpBlockRecord) => {
        try {
            await deleteIpBlock.mutateAsync(ipBlock.id);
            toast.success('IP engelleme kaldırıldı');
        } catch {
            toast.error('IP engelleme kaldırılamadı');
        }
    };

    const handleSubmitIpBlock = async (data: IpBlockFormData) => {
        try {
            const blockedUntil = getBlockedUntil(data.duration);

            if (selectedIpBlock?.id) {
                await updateIpBlock.mutateAsync({
                    id: selectedIpBlock.id,
                    data: {
                        ip_address: data.ip_address,
                        reason: data.reason,
                        blocked_until: blockedUntil,
                    },
                });
                toast.success('IP engeli güncellendi');
            } else {
                await createIpBlock.mutateAsync({
                    ip_address: data.ip_address,
                    reason: data.reason,
                    blocked_until: blockedUntil,
                });
                toast.success('IP engellendi');
            }
            setIpBlockDialogOpen(false);
        } catch {
            toast.error(selectedIpBlock?.id ? 'IP engeli güncellenemedi' : 'IP engellenemedi');
        }
    };

    const handleSaveAutoBlockSettings = async () => {
        try {
            await updateSettings.mutateAsync({
                security: {
                    ...securitySettings,
                    auto_block: autoBlockSettings,
                },
            });
            toast.success('Otomatik engelleme ayarları kaydedildi');
        } catch {
            toast.error('Ayarlar kaydedilemedi');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {settingsLoading ? (
                        <Skeleton className="h-4 w-32" />
                    ) : (
                        `${blockedIPs.length} engellenmiş IP`
                    )}
                </div>
                <Button onClick={handleAddIpBlock}>
                    <Plus className="mr-2 h-4 w-4" />
                    IP Engelle
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {settingsLoading ? (
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : blockedIPs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Engellenmiş IP adresi bulunmuyor
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>IP Adresi</TableHead>
                                    <TableHead>Neden</TableHead>
                                    <TableHead>Engelleyen</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Bitiş Tarihi</TableHead>
                                    <TableHead className="w-[70px]">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blockedIPs.map((ipBlock) => (
                                    <TableRow key={ipBlock.id}>
                                        <TableCell className="font-mono font-medium">
                                            {ipBlock.ip_address}
                                        </TableCell>
                                        <TableCell>{ipBlock.reason}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {ipBlock.blocked_by ?? ipBlock.created_by_email ?? ipBlock.created_by ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(ipBlock.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            {(ipBlock.expires_at ?? ipBlock.blocked_until) ? (
                                                <span className="text-muted-foreground">
                                                    {formatDate(ipBlock.expires_at ?? ipBlock.blocked_until ?? ipBlock.created_at)}
                                                </span>
                                            ) : (
                                                <Badge variant="secondary">Süresiz</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditIpBlock(ipBlock)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Düzenle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteIpBlock(ipBlock)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Kaldır
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Otomatik Engelleme Ayarları</CardTitle>
                    <CardDescription>
                        Başarısız giriş denemelerine göre otomatik IP engelleme
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {settingsLoading ? (
                        <Skeleton className="h-24 w-full" />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="failed-login-limit">
                                        Başarısız Giriş Limiti
                                    </Label>
                                    <Input
                                        id="failed-login-limit"
                                        type="number"
                                        min="1"
                                        value={autoBlockSettings.failedLoginLimit}
                                        onChange={(e) =>
                                            setAutoBlockSettings({
                                                ...autoBlockSettings,
                                                failedLoginLimit: parseInt(e.target.value),
                                            })
                                        }
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Bu sayıda başarısız denemeden sonra IP engellenir
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="block-duration">Engelleme Süresi</Label>
                                    <Select
                                        value={autoBlockSettings.blockDuration}
                                        onValueChange={(value) =>
                                            setAutoBlockSettings({
                                                ...autoBlockSettings,
                                                blockDuration: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger id="block-duration">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1h">1 Saat</SelectItem>
                                            <SelectItem value="24h">24 Saat</SelectItem>
                                            <SelectItem value="7d">7 Gün</SelectItem>
                                            <SelectItem value="30d">30 Gün</SelectItem>
                                            <SelectItem value="permanent">Süresiz</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    onClick={handleSaveAutoBlockSettings}
                                    disabled={updateSettings.isPending}
                                >
                                    {updateSettings.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <IpBlockDialog
                open={ipBlockDialogOpen}
                onOpenChange={setIpBlockDialogOpen}
                ipBlock={selectedIpBlock}
                onSubmit={handleSubmitIpBlock}
            />
        </div>
    );
}
