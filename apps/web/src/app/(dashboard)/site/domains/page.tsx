'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Globe,
    Shield,
    CheckCircle2,
    Clock,
    AlertCircle,
    Copy,
    ExternalLink,
} from 'lucide-react';

// Mock data
const mockDomains = [
    {
        id: '1',
        domain: 'demo.prosektorweb.com',
        status: 'active',
        ssl_status: 'active',
        is_primary: true,
        verified_at: '2024-01-15',
    },
    {
        id: '2',
        domain: 'www.demoosgb.com',
        status: 'pending',
        ssl_status: 'pending',
        is_primary: false,
        verified_at: null,
    },
];

const dnsRecords = [
    { type: 'CNAME', name: 'www', value: 'cname.prosektorweb.com' },
    { type: 'A', name: '@', value: '76.76.21.21' },
];

export default function DomainsPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [wizardStep, setWizardStep] = useState(1);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Aktif</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Bekliyor</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Hata</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Domainler & SSL</h1>
                    <p className="text-gray-500">Özel domain bağlayın ve SSL sertifikası yönetin</p>
                </div>
                <Button onClick={() => { setShowWizard(true); setWizardStep(1); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Domain Ekle
                </Button>
            </div>

            {/* Domain List */}
            <div className="space-y-4">
                {mockDomains.map((domain) => (
                    <Card key={domain.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Globe className="h-8 w-8 text-gray-400" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{domain.domain}</span>
                                            {domain.is_primary && <Badge variant="outline">Ana Domain</Badge>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            {getStatusBadge(domain.status)}
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Shield className="h-3 w-3" />
                                                SSL: {domain.ssl_status === 'active' ? 'Aktif' : 'Bekliyor'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm">Ayarlar</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Wizard */}
            {showWizard && (
                <Card>
                    <CardHeader>
                        <CardTitle>Domain Ekleme Sihirbazı</CardTitle>
                        <CardDescription>Adım {wizardStep} / 4</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {wizardStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Domain Adı</Label>
                                    <Input
                                        placeholder="example.com"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                    />
                                    <p className="text-sm text-gray-500">
                                        www ile veya www olmadan girebilirsiniz
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setShowWizard(false)}>İptal</Button>
                                    <Button onClick={() => setWizardStep(2)} disabled={!newDomain}>Devam</Button>
                                </div>
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Aşağıdaki DNS kayıtlarını domain sağlayıcınızda ekleyin:
                                </p>
                                <div className="space-y-2">
                                    {dnsRecords.map((record, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Tip:</span> {record.type}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Ad:</span> {record.name}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Değer:</span> {record.value}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(record.value)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setWizardStep(1)}>Geri</Button>
                                    <Button onClick={() => setWizardStep(3)}>DNS Ekledim, Devam</Button>
                                </div>
                            </div>
                        )}

                        {wizardStep === 3 && (
                            <div className="space-y-4 text-center py-8">
                                <div className="animate-pulse">
                                    <Clock className="h-12 w-12 mx-auto text-yellow-500" />
                                </div>
                                <div>
                                    <p className="font-medium">DNS Kontrolü Yapılıyor</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        DNS yayılması 24 saate kadar sürebilir
                                    </p>
                                </div>
                                <div className="flex justify-center gap-2">
                                    <Button variant="outline" onClick={() => setWizardStep(2)}>Geri</Button>
                                    <Button onClick={() => setWizardStep(4)}>Doğrulama Yap</Button>
                                </div>
                            </div>
                        )}

                        {wizardStep === 4 && (
                            <div className="space-y-4 text-center py-8">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                                <div>
                                    <p className="font-medium">Domain Bağlandı!</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        SSL sertifikası otomatik olarak oluşturulacak
                                    </p>
                                </div>
                                <Button onClick={() => setShowWizard(false)}>Tamamla</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
