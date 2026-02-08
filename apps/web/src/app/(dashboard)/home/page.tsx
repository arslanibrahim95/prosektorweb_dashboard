import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Globe,
    Shield,
    Clock,
    TrendingUp,
    Users,
    FileText,
    ChevronRight,
    CheckCircle2,
    Circle,
    ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const siteHealth = {
    domain: { status: 'active', label: 'Domain Aktif' },
    ssl: { status: 'active', label: 'SSL Aktif' },
    lastPublish: '2 saat önce',
};

const recentActivity = [
    { id: '1', type: 'offer', name: 'Ahmet Yılmaz', time: '2 saat önce', email: 'offer@site.com' },
    { id: '2', type: 'contact', name: 'Mehmet Kaya', time: '5 saat önce', email: 'info@site.com' },
    { id: '3', type: 'application', name: 'Ayşe Demir', time: '1 gün önce', job: 'İş Güvenliği Uzmanı' },
];

const checklist = [
    { id: '1', label: 'Logo yükle', completed: true, href: '/site/theme' },
    { id: '2', label: 'İletişim bilgilerini güncelle', completed: false, href: '/modules/contact' },
    { id: '3', label: 'İlk sayfayı düzenle', completed: true, href: '/site/pages' },
    { id: '4', label: 'Domain bağla', completed: false, href: '/site/domains' },
    { id: '5', label: 'Siteyi yayınla', completed: false, href: '/site/publish' },
];

const stats = [
    { label: 'Ziyaretçi (7 gün)', value: '1,234', icon: TrendingUp, trend: '+12%' },
    { label: 'Form Gönderimi', value: '23', icon: FileText, trend: '+5' },
    { label: 'Aktif İlanlar', value: '3', icon: Users, trend: '' },
];

export default function HomePage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hoş Geldiniz, Ahmet</h1>
                    <p className="text-gray-500">Demo OSGB Dashboard&apos;a genel bakış</p>
                </div>
                <Button asChild>
                    <Link href="/site/builder">
                        Siteyi Düzenle
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* Site Health */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Site Durumu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {siteHealth.domain.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Shield className="h-3 w-3 mr-1" />
                                {siteHealth.ssl.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Son yayın: {siteHealth.lastPublish}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            {stat.trend && (
                                <p className="text-sm text-green-600 mt-2">{stat.trend}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Son Aktiviteler</CardTitle>
                        <CardDescription>Son gelen başvurular ve mesajlar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${item.type === 'offer' ? 'bg-blue-500' :
                                                item.type === 'contact' ? 'bg-green-500' : 'bg-purple-500'
                                            }`} />
                                        <div>
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.type === 'offer' ? 'Teklif' :
                                                    item.type === 'contact' ? 'İletişim' : item.job}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{item.time}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4" asChild>
                            <Link href="/inbox/offers">
                                Tümünü Gör
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Checklist */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Kurulum Checklist</CardTitle>
                        <CardDescription>Sitenizi yayınlamadan önce tamamlayın</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {checklist.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                                >
                                    {item.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-300" />
                                    )}
                                    <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                                        {item.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-500">
                                Tamamlanan: {checklist.filter(c => c.completed).length}/{checklist.length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
