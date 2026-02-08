'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard,
    CheckCircle2,
    Calendar,
    Download,
    ExternalLink,
} from 'lucide-react';

// Mock data
const currentPlan = {
    name: 'Pro',
    price: '₺499/ay',
    nextBilling: '1 Mart 2024',
    features: [
        'Sınırsız sayfa',
        'Özel domain',
        '5 kullanıcı',
        'Email desteği',
    ],
};

const invoices = [
    { id: '1', date: '1 Şubat 2024', amount: '₺499', status: 'paid' },
    { id: '2', date: '1 Ocak 2024', amount: '₺499', status: 'paid' },
    { id: '3', date: '1 Aralık 2023', amount: '₺499', status: 'paid' },
];

export default function BillingPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Fatura & Abonelik</h1>
                <p className="text-gray-500">Plan ve fatura bilgilerinizi yönetin</p>
            </div>

            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Mevcut Plan</CardTitle>
                            <CardDescription>Aktif aboneliğiniz</CardDescription>
                        </div>
                        <Badge className="bg-primary text-white">{currentPlan.name}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-gray-600">Aylık Ücret</span>
                        <span className="font-medium">{currentPlan.price}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-gray-600">Sonraki Fatura</span>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{currentPlan.nextBilling}</span>
                        </div>
                    </div>
                    <div className="py-3">
                        <p className="text-gray-600 mb-2">Dahil Özellikler:</p>
                        <ul className="space-y-2">
                            {currentPlan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline">Plan Değiştir</Button>
                        <Button variant="ghost" className="text-red-600">İptal Et</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Ödeme Yöntemi
                    </CardTitle>
                    <CardDescription>Kayıtlı ödeme bilgileriniz</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-16 bg-gray-100 rounded flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="font-medium">•••• •••• •••• 4242</p>
                                <p className="text-sm text-gray-500">Son kullanma: 12/25</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Güncelle</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Fatura Geçmişi</CardTitle>
                    <CardDescription>Son faturalarınız</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {invoices.map((invoice) => (
                            <div key={invoice.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="font-medium text-sm">{invoice.date}</p>
                                        <p className="text-sm text-gray-500">{invoice.amount}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-700">Ödendi</Badge>
                                    <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Billing Portal */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Detaylı Fatura Yönetimi</p>
                            <p className="text-sm text-gray-500">Stripe portalında tüm işlemleri görüntüleyin</p>
                        </div>
                        <Button variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Fatura Portalı
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
