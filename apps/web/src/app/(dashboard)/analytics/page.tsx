'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { TrafficChart } from '@/components/charts/traffic-chart';
import { ActivityChart } from '@/components/charts/activity-chart';
import { StatCard } from '@/components/charts/stat-card';

const performanceMetrics = [
  { label: 'Dönüşüm Oranı', value: '3.24%', change: 12.5, trend: 'up' },
  { label: 'Ortalama Proje Süresi', value: '45 gün', change: -8.2, trend: 'down' },
  { label: 'Müşteri Memnuniyeti', value: '4.8/5', change: 5.1, trend: 'up' },
  { label: 'Tekrar Müşteri Oranı', value: '68%', change: 15.3, trend: 'up' },
];

const topClients = [
  { name: 'TechCorp', revenue: 125000, projects: 5, growth: 25 },
  { name: 'Marketing Pro', revenue: 98000, projects: 8, growth: 18 },
  { name: 'Design Studio', revenue: 85000, projects: 3, growth: 12 },
  { name: 'E-Commerce Ltd.', revenue: 72000, projects: 4, growth: -5 },
  { name: 'Startup.io', revenue: 45000, projects: 1, growth: 30 },
];

const recentReports = [
  { id: '1', name: 'Aylık Performans Raporu', date: '2026-02-24', type: 'PDF', size: '2.4 MB' },
  { id: '2', name: 'Müşteri Analizi Q1', date: '2026-02-20', type: 'XLSX', size: '1.8 MB' },
  { id: '3', name: 'Proje Özeti Şubat', date: '2026-02-15', type: 'PDF', size: '3.1 MB' },
  { id: '4', name: 'Gelir Raporu 2025', date: '2026-01-31', type: 'PDF', size: '4.2 MB' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30days');

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Raporlama & Analiz
          </h1>
          <p className="text-muted-foreground mt-1">
            İşletme performansınızı detaylı analiz edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Son 7 Gün</SelectItem>
              <SelectItem value="30days">Son 30 Gün</SelectItem>
              <SelectItem value="90days">Son 90 Gün</SelectItem>
              <SelectItem value="1year">Son 1 Yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Gelir"
          value="₺568K"
          trend={24.5}
          trendLabel="geçen döneme göre"
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Aktif Müşteri"
          value="89"
          trend={12.8}
          trendLabel="geçen döneme göre"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Tamamlanan Proje"
          value="47"
          trend={18.2}
          trendLabel="geçen döneme göre"
          icon={BarChart3}
          variant="default"
        />
        <StatCard
          title="Büyüme Oranı"
          value="%32"
          trend={8.5}
          trendLabel="geçen döneme göre"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueChart />
        <TrafficChart />
      </div>

      {/* Performance Metrics */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Performans Metrikleri</CardTitle>
          <CardDescription>Kilit başarı göstergeleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric) => (
              <div
                key={metric.label}
                className="p-4 rounded-xl bg-muted/50 border border-border/50"
              >
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={
                      metric.trend === 'up' ? 'text-success text-sm' : 'text-destructive text-sm'
                    }
                  >
                    {metric.change > 0 ? '+' : ''}
                    {metric.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs geçen dönem</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Clients & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle>En İyi Müşteriler</CardTitle>
            <CardDescription>Gelire göre sıralanmış müşteriler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div
                  key={client.name}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.projects} proje
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₺{client.revenue.toLocaleString()}
                    </p>
                    <p
                      className={
                        client.growth >= 0 ? 'text-xs text-success' : 'text-xs text-destructive'
                      }
                    >
                      {client.growth >= 0 ? '+' : ''}
                      {client.growth}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rapor Geçmişi</CardTitle>
                <CardDescription>İndirilebilir raporlar</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Tümünü İndir
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.date).toLocaleDateString('tr-TR')} • {report.size}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{report.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Günlük Aktivite Özeti</CardTitle>
          <CardDescription>Saatlik kullanıcı etkileşimi</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityChart />
        </CardContent>
      </Card>
    </div>
  );
}
