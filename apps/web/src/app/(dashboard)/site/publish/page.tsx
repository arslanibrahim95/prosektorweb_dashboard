'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Send,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Plus,
    Minus,
    Edit,
} from 'lucide-react';

// Mock data
const stagingChanges = [
    { type: 'updated', page: 'Anasayfa', description: 'Hero bölümü güncellendi' },
    { type: 'created', page: 'Blog', description: 'Yeni sayfa oluşturuldu' },
    { type: 'updated', page: 'İletişim', description: 'Form ayarları değiştirildi' },
];

const prePublishChecks = [
    { label: 'Anasayfa meta başlığı mevcut', passed: true },
    { label: 'Anasayfa meta açıklaması mevcut', passed: true },
    { label: 'Tüm sayfalarda geçerli slug var', passed: true },
    { label: 'Kırık iç link yok', passed: true },
    { label: 'En az bir görsel alt text içeriyor', passed: false },
];

const revisions = [
    { id: '1', date: '8 Şubat 2024, 14:30', user: 'Ahmet Yılmaz', type: 'Production' },
    { id: '2', date: '7 Şubat 2024, 16:45', user: 'Ahmet Yılmaz', type: 'Staging' },
    { id: '3', date: '5 Şubat 2024, 11:20', user: 'Mehmet Kaya', type: 'Production' },
];

export default function PublishPage() {
    const allChecksPassed = prePublishChecks.every(c => c.passed);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Yayınlama</h1>
                <p className="text-gray-500">Staging ve Production ortamlarını yönetin</p>
            </div>

            {/* Environment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Staging */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-blue-500" />
                                Staging
                            </CardTitle>
                            <Badge variant="outline">Önizleme</Badge>
                        </div>
                        <CardDescription>Test ve önizleme ortamı</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            Son güncelleme: 10 dakika önce
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" asChild>
                                <a href="https://staging.demo.prosektorweb.com" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Önizle
                                </a>
                            </Button>
                            <Button className="flex-1">
                                <Send className="mr-2 h-4 w-4" />
                                Staging&apos;e Yayınla
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Production */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-green-500" />
                                Production
                            </CardTitle>
                            <Badge className="bg-green-100 text-green-700">Canlı</Badge>
                        </div>
                        <CardDescription>Canlı site ortamı</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            Son yayın: 2 gün önce
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" asChild>
                                <a href="https://demo.prosektorweb.com" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Siteyi Aç
                                </a>
                            </Button>
                            <Button className="flex-1" disabled={!allChecksPassed}>
                                <Send className="mr-2 h-4 w-4" />
                                Production&apos;a Al
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Changes */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Bekleyen Değişiklikler</CardTitle>
                    <CardDescription>Staging&apos;de yayınlanmayı bekleyen değişiklikler</CardDescription>
                </CardHeader>
                <CardContent>
                    {stagingChanges.length > 0 ? (
                        <div className="space-y-3">
                            {stagingChanges.map((change, i) => (
                                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                                    {change.type === 'created' ? (
                                        <Plus className="h-4 w-4 text-green-500" />
                                    ) : change.type === 'updated' ? (
                                        <Edit className="h-4 w-4 text-blue-500" />
                                    ) : (
                                        <Minus className="h-4 w-4 text-red-500" />
                                    )}
                                    <div>
                                        <span className="font-medium text-sm">{change.page}</span>
                                        <p className="text-xs text-gray-500">{change.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">
                            Bekleyen değişiklik yok
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Pre-publish Checklist */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Yayın Öncesi Kontrol</CardTitle>
                    <CardDescription>Production&apos;a almadan önce aşağıdaki kontroller yapılır</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {prePublishChecks.map((check, i) => (
                            <div key={i} className="flex items-center gap-3">
                                {check.passed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                )}
                                <span className={check.passed ? 'text-gray-700' : 'text-yellow-700'}>
                                    {check.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Revisions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Yayın Geçmişi
                    </CardTitle>
                    <CardDescription>Son yayınlar ve revizyonlar</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {revisions.map((rev) => (
                            <div key={rev.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${rev.type === 'Production' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    <div>
                                        <span className="text-sm font-medium">{rev.date}</span>
                                        <p className="text-xs text-gray-500">{rev.user}</p>
                                    </div>
                                </div>
                                <Badge variant="outline">{rev.type}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
