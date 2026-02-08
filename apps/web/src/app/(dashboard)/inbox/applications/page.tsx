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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { EmptyState, TableSkeleton } from '@/components/layout';
import { Search, Calendar, Mail, Phone, FileText, Eye, Download, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Mock data
const mockJobPosts = [
    { id: '1', title: 'İş Güvenliği Uzmanı' },
    { id: '2', title: 'İşyeri Hekimi' },
    { id: '3', title: 'Hemşire' },
];

const mockApplications = [
    {
        id: '1',
        job_post_id: '1',
        job_post: { id: '1', title: 'İş Güvenliği Uzmanı' },
        full_name: 'Can Yılmaz',
        email: 'can@email.com',
        phone: '+90 538 111 2233',
        message: '5 yıllık deneyimim var. A sınıfı sertifikam mevcut.',
        cv_path: '/cv/can-yilmaz.pdf',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        job_post_id: '2',
        job_post: { id: '2', title: 'İşyeri Hekimi' },
        full_name: 'Dr. Aylin Kara',
        email: 'aylin@email.com',
        phone: '+90 539 222 3344',
        message: 'İşyeri hekimliği sertifikam ve 10 yıllık tecrübem bulunmaktadır.',
        cv_path: '/cv/aylin-kara.pdf',
        is_read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        job_post_id: '1',
        job_post: { id: '1', title: 'İş Güvenliği Uzmanı' },
        full_name: 'Burak Şahin',
        email: 'burak@email.com',
        phone: '+90 540 333 4455',
        message: 'B sınıfı iş güvenliği uzmanıyım. 3 yıl deneyimim var.',
        cv_path: '/cv/burak-sahin.pdf',
        is_read: false,
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
];

type JobApplication = typeof mockApplications[number];

export default function ApplicationsInboxPage() {
    const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
    const [isLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [jobFilter, setJobFilter] = useState<string>('all');

    const filteredApplications = mockApplications.filter(app => {
        const matchesSearch =
            app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesJob = jobFilter === 'all' || app.job_post_id === jobFilter;
        return matchesSearch && matchesJob;
    });

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
                <h1 className="text-2xl font-bold">İş Başvuruları</h1>
                <TableSkeleton columns={6} rows={5} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">İş Başvuruları</h1>
                    <p className="text-gray-500">Gelen kariyer başvuruları</p>
                </div>
                <Badge variant="secondary">
                    {mockApplications.filter(a => !a.is_read).length} okunmamış
                </Badge>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="İsim veya email ara..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="İlan Filtresi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm İlanlar</SelectItem>
                        {mockJobPosts.map(job => (
                            <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Tarih Filtresi
                </Button>
            </div>

            {/* Table */}
            {filteredApplications.length === 0 ? (
                <EmptyState
                    icon={<Briefcase className="h-12 w-12" />}
                    title="Henüz başvuru yok"
                    description="Kariyer sayfanızdaki ilanlara yapılan başvurular burada görüntülenecek."
                    action={{
                        label: 'İş İlanlarını Yönet',
                        onClick: () => window.location.href = '/modules/hr/job-posts',
                    }}
                />
            ) : (
                <div className="rounded-lg border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>İlan</TableHead>
                                <TableHead>Ad Soyad</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>CV</TableHead>
                                <TableHead className="w-[100px]">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApplications.map((application) => (
                                <TableRow
                                    key={application.id}
                                    className={`cursor-pointer hover:bg-gray-50 ${!application.is_read ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => setSelectedApplication(application)}
                                >
                                    <TableCell>
                                        {!application.is_read && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {formatRelativeTime(application.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{application.job_post.title}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{application.full_name}</TableCell>
                                    <TableCell>{application.email}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // In real app, this would download/open the CV
                                                window.open(application.cv_path, '_blank');
                                            }}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedApplication(application);
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
            <Sheet open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
                <SheetContent className="sm:max-w-lg">
                    {selectedApplication && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedApplication.full_name}</SheetTitle>
                                <SheetDescription>
                                    {formatDate(selectedApplication.created_at)}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                {/* Job Info */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Başvurulan İlan</h4>
                                    <Badge>{selectedApplication.job_post.title}</Badge>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <a href={`mailto:${selectedApplication.email}`} className="text-blue-600 hover:underline">
                                            {selectedApplication.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <a href={`tel:${selectedApplication.phone}`} className="text-blue-600 hover:underline">
                                            {selectedApplication.phone}
                                        </a>
                                    </div>
                                </div>

                                {/* Message */}
                                {selectedApplication.message && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Ön Yazı</h4>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                            {selectedApplication.message}
                                        </p>
                                    </div>
                                )}

                                {/* CV */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">CV / Özgeçmiş</h4>
                                    <Button variant="outline" className="w-full" asChild>
                                        <a href={selectedApplication.cv_path} target="_blank" rel="noopener noreferrer">
                                            <FileText className="mr-2 h-4 w-4" />
                                            CV&apos;yi Görüntüle / İndir
                                        </a>
                                    </Button>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button className="flex-1" asChild>
                                        <a href={`mailto:${selectedApplication.email}?subject=Re: ${selectedApplication.job_post.title} Başvurusu`}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Email Gönder
                                        </a>
                                    </Button>
                                    <Button variant="outline" className="flex-1" asChild>
                                        <a href={`tel:${selectedApplication.phone}`}>
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
