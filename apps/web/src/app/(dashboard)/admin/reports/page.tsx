"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminReports, useCreateReport, useDeleteReport } from "@/hooks/use-admin";
import { toast } from "sonner";
import {
    Plus,
    FileText,
    Download,
    MoreVertical,
    Trash2,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    FileSpreadsheet,
    File,
    Calendar
} from "lucide-react";

const reportTypes = [
    { value: 'users', label: 'Kullanıcılar Raporu', description: 'Kullanıcı verileri ve aktiviteleri' },
    { value: 'content', label: 'İçerik Raporu', description: 'Sayfa ve yazı istatistikleri' },
    { value: 'analytics', label: 'Analitik Raporu', description: 'Site trafiği ve performans' },
    { value: 'revenue', label: 'Gelir Raporu', description: 'Abonelik ve ödeme verileri' },
    { value: 'custom', label: 'Özel Rapor', description: 'Özelleştirilmiş rapor' },
];

const formatLabels: Record<string, string> = {
    csv: 'CSV',
    xlsx: 'Excel',
    pdf: 'PDF',
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: 'Bekliyor', variant: 'secondary' },
    processing: { label: 'İşleniyor', variant: 'outline' },
    completed: { label: 'Tamamlandı', variant: 'default' },
    failed: { label: 'Başarısız', variant: 'destructive' },
};

export default function ReportsPage() {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [reportName, setReportName] = useState("");
    const [reportType, setReportType] = useState("");
    const [reportFormat, setReportFormat] = useState("csv");
    const [dateRange, setDateRange] = useState("30d");
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const { data: reportsData, isLoading, refetch } = useAdminReports();
    const createReport = useCreateReport();
    const deleteReport = useDeleteReport();

    const reports = (reportsData as any)?.items || [];

    const handleDeleteReport = async () => {
        if (!deleteTarget) return;
        try {
            await deleteReport.mutateAsync(deleteTarget.id);
            toast.success('Rapor silindi');
        } catch {
            toast.error('Rapor silinemedi');
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleCreateReport = async () => {
        if (!reportName.trim() || !reportType) {
            toast.error("Lütfen gerekli alanları doldurun");
            return;
        }

        try {
            await createReport.mutateAsync({
                name: reportName,
                type: reportType as 'users' | 'content' | 'analytics' | 'revenue' | 'custom',
                format: reportFormat as 'csv' | 'xlsx' | 'pdf',
                parameters: { date_range: dateRange },
            });

            toast.success("Rapor oluşturuldu. Hazırlanması biraz sürecek.");
            refetch();
            setCreateDialogOpen(false);

            // Reset form
            setReportName("");
            setReportType("");
            setReportFormat("csv");
            setDateRange("30d");
        } catch (error) {
            toast.error("Rapor oluşturulamadı");
        }
    };

    const handleDownload = (report: any) => {
        if (report.file_url) {
            window.open(report.file_url, '_blank');
            toast.success("İndirme başladı");
        } else {
            toast.error("Dosya henüz hazırlanmadı");
        }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Raporlar"
                description="Verilerinizi dışa aktarın ve analiz edin"
            />

            {/* Quick Actions */}
            <div className="flex gap-2">
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Rapor Oluştur
                </Button>
            </div>

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Rapor Geçmişi</CardTitle>
                    <CardDescription>
                        Oluşturduğunuz ve indirebileceğiniz raporlar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Henüz rapor yok</p>
                            <p className="text-sm">Yeni bir rapor oluşturarak başlayın</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rapor Adı</TableHead>
                                    <TableHead>Tür</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Oluşturulma</TableHead>
                                    <TableHead>Bitiş</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report: any) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {report.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatLabels[report.format] || report.format}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusLabels[report.status]?.variant || 'outline'}>
                                                {report.status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                                {statusLabels[report.status]?.label || report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {report.created_at ? new Date(report.created_at).toLocaleDateString('tr-TR') : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {report.completed_at ? new Date(report.completed_at).toLocaleDateString('tr-TR') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDownload(report)}
                                                        disabled={report.status !== 'completed'}
                                                    >
                                                        <Download className="mr-2 h-4 w-4" />
                                                        İndir
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteTarget({ id: report.id, name: report.name })}
                                                    >
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
                    )}
                </CardContent>
            </Card>

            {/* Create Report Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Rapor Oluştur</DialogTitle>
                        <DialogDescription>
                            Verilerinizi dışa aktarmak için bir rapor oluşturun
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Rapor Adı</Label>
                            <Input
                                id="name"
                                placeholder="Örneğin: Ocak 2024 Kullanıcı Raporu"
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Rapor Türü</Label>
                            <div className="grid gap-2">
                                {reportTypes.map((type) => (
                                    <div
                                        key={type.value}
                                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${reportType === type.value
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:bg-muted'
                                            }`}
                                        onClick={() => setReportType(type.value)}
                                    >
                                        <div className="font-medium">{type.label}</div>
                                        <div className="text-sm text-muted-foreground">{type.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <Select value={reportFormat} onValueChange={setReportFormat}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="csv">CSV</SelectItem>
                                        <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tarih Aralığı</Label>
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7d">Son 7 gün</SelectItem>
                                        <SelectItem value="30d">Son 30 gün</SelectItem>
                                        <SelectItem value="90d">Son 90 gün</SelectItem>
                                        <SelectItem value="1y">Son 1 yıl</SelectItem>
                                        <SelectItem value="all">Tüm zamanlar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                İptal
                            </Button>
                            <Button onClick={handleCreateReport} disabled={createReport.isPending}>
                                {createReport.isPending ? "Oluşturuluyor..." : "Oluştur"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Raporu Sil"
                description={`"${deleteTarget?.name}" raporunu silmek istediğinizden emin misiniz?`}
                confirmLabel="Sil"
                onConfirm={handleDeleteReport}
                isLoading={deleteReport.isPending}
            />
        </div>
    );
}
