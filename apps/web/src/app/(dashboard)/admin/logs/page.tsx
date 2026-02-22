"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Download,
    Filter,
    ScrollText,
    AlertCircle,
    Clock,
    User,
    Database,
} from "lucide-react";
import { useAdminLogs } from "@/hooks/use-admin";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface LogItem {
    id: string;
    actor_id: string | null;
    actor_email?: string;
    actor_name?: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    created_at: string;
    ip_address: string | null;
    meta: Record<string, unknown> | null;
}

interface LogsResponse {
    items?: LogItem[];
    total?: number;
    page?: number;
    limit?: number;
    stats?: {
        total: number;
        byAction: Record<string, number>;
    };
    // Backward compatibility for previous API shape
    data?: LogItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function getActionBadge(action: string) {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("create") || actionLower.includes("insert")) {
        return <Badge className="bg-green-500">Oluşturma</Badge>;
    }
    if (actionLower.includes("update") || actionLower.includes("edit")) {
        return <Badge className="bg-blue-500">Güncelleme</Badge>;
    }
    if (actionLower.includes("delete") || actionLower.includes("remove")) {
        return <Badge className="bg-red-500">Silme</Badge>;
    }
    if (actionLower.includes("login") || actionLower.includes("signin")) {
        return <Badge className="bg-purple-500">Giriş</Badge>;
    }
    return <Badge variant="outline">Diğer</Badge>;
}

export default function ActivityLogsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [logType, setLogType] = useState("all");
    const [dateRange, setDateRange] = useState("24h");
    const [page, setPage] = useState(1);

    // Keep date_from stable between renders so queryKey does not thrash.
    const dateFrom = useMemo(() => {
        const now = new Date();
        switch (dateRange) {
            case "1h":
                return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
            case "24h":
                return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            case "7d":
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            case "30d":
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            default:
                return undefined;
        }
    }, [dateRange]);

    const { data, isLoading, error } = useAdminLogs({
        search: searchQuery || undefined,
        action: logType !== "all" ? logType : undefined,
        page,
        limit: 20,
        date_from: dateFrom,
    });

    const logsData = data as LogsResponse | undefined;
    const logs = logsData?.items ?? logsData?.data ?? [];
    const totalLogs = logsData?.total ?? logsData?.pagination?.total ?? logs.length;
    const currentPage = logsData?.page ?? logsData?.pagination?.page ?? page;
    const pageSize = logsData?.limit ?? logsData?.pagination?.limit ?? 20;
    const totalPages =
        logsData?.pagination?.totalPages ?? Math.max(1, Math.ceil(totalLogs / pageSize));
    const statsTotal = logsData?.stats?.total ?? totalLogs;

    const handleExport = () => {
        if (!logs.length) {
            toast.error('Dışa aktarılacak log bulunamadı');
            return;
        }

        const headers = ['Tarih', 'Kullanıcı', 'İşlem', 'Varlık Türü', 'Varlık ID', 'IP Adresi'];
        const rows = logs.map((log: LogItem) => [
            log.created_at ? new Date(log.created_at).toLocaleString('tr-TR') : '',
            log.actor_email || log.actor_name || log.actor_id || '',
            log.action,
            log.entity_type || '',
            log.entity_id || '',
            log.ip_address || '',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Loglar CSV olarak indirildi');
    };

    const handleRefresh = () => {
        // Refetch is handled by React Query automatically
        toast.success('Loglar yenilendi');
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Aktivite Logları"
                description="Sistem aktivitelerini ve olaylarını görüntüleyin"
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <AdminStatCard
                    title="Toplam Olay"
                    value={statsTotal.toString()}
                    description="Toplam log sayısı"
                    icon={<ScrollText className="h-4 w-4" />}
                />
                <AdminStatCard
                    title="Bu Sayfa"
                    value={logs.length.toString()}
                    description={`${totalPages} sayfadan ${currentPage}.`}
                    icon={<Database className="h-4 w-4" />}
                />
                <AdminStatCard
                    title="Son Olay"
                    value={logs[0] ? formatDistanceToNow(new Date(logs[0].created_at), { addSuffix: true, locale: tr }) : "Yok"}
                    description="En son aktivite"
                    icon={<Clock className="h-4 w-4" />}
                />
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtreler</CardTitle>
                    <CardDescription>
                        Logları filtrelemek için aşağıdaki seçenekleri kullanın
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Ara..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full"
                            />
                        </div>
                        <Select value={logType} onValueChange={(v) => { setLogType(v); setPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="İşlem Tipi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="create">Oluşturma</SelectItem>
                                <SelectItem value="update">Güncelleme</SelectItem>
                                <SelectItem value="delete">Silme</SelectItem>
                                <SelectItem value="login">Giriş</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Zaman Aralığı" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1h">Son 1 saat</SelectItem>
                                <SelectItem value="24h">Son 24 saat</SelectItem>
                                <SelectItem value="7d">Son 7 gün</SelectItem>
                                <SelectItem value="30d">Son 30 gün</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleRefresh}>
                            <Filter className="mr-2 h-4 w-4" />
                            Yenile
                        </Button>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Dışa Aktar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Sistem Logları</CardTitle>
                            <CardDescription>
                                Toplam {totalLogs} kayıt
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-destructive">
                            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                            <p>Loglar yüklenirken hata oluştu</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <ScrollText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Bu filtrede log bulunamadı</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Kullanıcı</TableHead>
                                        <TableHead>İşlem</TableHead>
                                        <TableHead>Nesne</TableHead>
                                        <TableHead>IP</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: tr })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">
                                                        {log.actor_name || log.actor_email || "Sistem"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getActionBadge(log.action)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{log.entity_type}</span>
                                                    {log.entity_id && (
                                                        <span className="text-xs text-muted-foreground">{log.entity_id.slice(0, 8)}...</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {log.ip_address || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Sayfa {currentPage} / {totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Önceki
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Sonraki
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
