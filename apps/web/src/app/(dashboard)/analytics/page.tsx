import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    Eye,
    Clock,
    FileText,
    Users,
} from 'lucide-react';

// Mock stats
const stats = [
    { label: 'Sayfa Görüntüleme', value: '12,345', change: '+15%', icon: Eye },
    { label: 'Tekil Ziyaretçi', value: '3,456', change: '+8%', icon: Users },
    { label: 'Ortalama Süre', value: '2m 34s', change: '+5%', icon: Clock },
    { label: 'Form Gönderimi', value: '89', change: '+23%', icon: FileText },
];

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500">Site performansı ve ziyaretçi istatistikleri</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <stat.icon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">{stat.change} son 30 gün</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Ziyaretçi Trendi</CardTitle>
                    <CardDescription>Son 30 günün günlük ziyaretçi sayısı</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                            <p>Grafik burada gösterilecek</p>
                            <p className="text-sm">(Chart library entegrasyonu gerekli)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">En Çok Ziyaret Edilen Sayfalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { page: 'Anasayfa', views: '5,234', percent: 42 },
                                { page: '/hizmetler', views: '2,123', percent: 17 },
                                { page: '/iletisim', views: '1,456', percent: 12 },
                                { page: '/hakkimizda', views: '987', percent: 8 },
                                { page: '/kariyer', views: '654', percent: 5 },
                            ].map((item) => (
                                <div key={item.page} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.page}</span>
                                            <span className="text-sm text-gray-500">{item.views}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Trafik Kaynakları</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { source: 'Organik Arama', percent: 45 },
                                { source: 'Direkt', percent: 30 },
                                { source: 'Sosyal Medya', percent: 15 },
                                { source: 'Referans', percent: 10 },
                            ].map((item) => (
                                <div key={item.source} className="flex items-center justify-between">
                                    <span className="text-sm">{item.source}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                        <Badge variant="secondary">{item.percent}%</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
