'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

const projects = [
  {
    id: '1',
    name: 'E-Ticaret Web Sitesi',
    status: 'in_progress',
    progress: 65,
    deadline: '2026-03-15',
    lastUpdate: '2 gün önce',
  },
  {
    id: '2',
    name: 'Mobil Uygulama Tasarımı',
    status: 'review',
    progress: 90,
    deadline: '2026-02-28',
    lastUpdate: 'Dün',
  },
];

const recentActivity = [
  { id: '1', text: 'Proje dosyaları güncellendi', time: '2 saat önce', type: 'file' },
  { id: '2', text: 'Yeni yorum eklendi', time: '5 saat önce', type: 'comment' },
  { id: '3', text: 'Milestone tamamlandı', time: '1 gün önce', type: 'milestone' },
];

const messages = [
  {
    id: '1',
    from: 'Proje Yöneticisi',
    subject: 'Haftalık Güncelleme',
    preview: 'Bu hafta tamamlanan işler ve sonraki adımlar...',
    time: '2 saat önce',
    unread: true,
  },
  {
    id: '2',
    from: 'Tasarım Ekibi',
    subject: 'Onayınız Gerekli',
    preview: 'Yeni tasarım konseptlerini inceleyebilir misiniz?',
    time: 'Dün',
    unread: false,
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  in_progress: { label: 'Devam Ediyor', color: 'bg-primary/10 text-primary' },
  review: { label: 'İnceleme', color: 'bg-warning/10 text-warning' },
  completed: { label: 'Tamamlandı', color: 'bg-success/10 text-success' },
};

function getStatusInfo(status: string) {
  return statusConfig[status] ?? { label: status, color: 'bg-muted text-muted-foreground' };
}

export default function ClientPortalPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Hoş Geldiniz, Ahmet</h1>
        <p className="text-muted-foreground">
          Projelerinizin durumunu buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Aktif Proje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Tamamlanan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Bekleyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Yeni Mesaj</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aktif Projeler</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/projects">
                Tümünü Gör
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {projects.map((project) => (
            <Card key={project.id} className="glass hover-lift cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{project.name}</h3>
                      <Badge
                        variant="outline"
                        className={getStatusInfo(project.status).color}
                      >
                        {getStatusInfo(project.status).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(project.deadline).toLocaleDateString('tr-TR')}
                      </span>
                      <span>Son güncelleme: {project.lastUpdate}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">İlerleme</span>
                    <span className="font-medium">%{project.progress}</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="flex-1">{activity.text}</span>
                    <span className="text-muted-foreground text-xs">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages & Quick Actions */}
        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Mesajlar</CardTitle>
                <Badge variant="secondary">{messages.filter(m => m.unread).length} yeni</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      message.unread ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {message.from.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {message.from}
                          </p>
                          {message.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {message.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {message.preview}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-right mt-2">
                      {message.time}
                    </p>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3" size="sm">
                Tüm Mesajları Gör
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Yeni Proje Başlat
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Destek Talebi Oluştur
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Toplantı Planla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
