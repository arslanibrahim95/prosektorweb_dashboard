'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  PauseCircle,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ProjectsStatusChart } from '@/components/charts/projects-status-chart';
import { StatCard } from '@/components/charts/stat-card';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  progress: number;
  deadline: string;
  budget: number;
  team: { name: string; avatar?: string }[];
  priority: 'low' | 'medium' | 'high';
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'E-Ticaret Web Sitesi',
    client: 'TechCorp',
    status: 'in_progress',
    progress: 65,
    deadline: '2026-03-15',
    budget: 85000,
    team: [
      { name: 'Ali K.', avatar: '' },
      { name: 'Zeynep T.', avatar: '' },
    ],
    priority: 'high',
  },
  {
    id: '2',
    name: 'Mobil Uygulama',
    client: 'Startup.io',
    status: 'planning',
    progress: 15,
    deadline: '2026-05-20',
    budget: 120000,
    team: [
      { name: 'Mehmet D.', avatar: '' },
    ],
    priority: 'medium',
  },
  {
    id: '3',
    name: 'Kurumsal Kimlik',
    client: 'Design Studio',
    status: 'review',
    progress: 90,
    deadline: '2026-02-28',
    budget: 35000,
    team: [
      { name: 'Ayşe S.', avatar: '' },
    ],
    priority: 'medium',
  },
  {
    id: '4',
    name: 'SEO Optimizasyonu',
    client: 'Marketing Pro',
    status: 'completed',
    progress: 100,
    deadline: '2026-01-30',
    budget: 25000,
    team: [
      { name: 'Can Ö.', avatar: '' },
    ],
    priority: 'low',
  },
  {
    id: '5',
    name: 'Dashboard Yenileme',
    client: 'E-Commerce Ltd.',
    status: 'on_hold',
    progress: 40,
    deadline: '2026-04-10',
    budget: 60000,
    team: [
      { name: 'Ali K.', avatar: '' },
      { name: 'Zeynep T.', avatar: '' },
      { name: 'Mehmet D.', avatar: '' },
    ],
    priority: 'high',
  },
];

const statusConfig = {
  planning: { label: 'Planlama', icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted' },
  in_progress: { label: 'Devam Ediyor', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
  review: { label: 'İnceleme', icon: CheckCircle2, color: 'text-warning', bg: 'bg-warning/10' },
  completed: { label: 'Tamamlandı', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  on_hold: { label: 'Beklemede', icon: PauseCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-destructive/20 text-destructive',
};

const priorityLabels = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [projects] = useState<Project[]>(mockProjects);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProjects = projects.filter((p) => p.status === 'in_progress').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const avgProgress = Math.round(
    projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
  );

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Proje Takibi
          </h1>
          <p className="text-muted-foreground mt-1">
            Tüm projelerinizi yönetin ve takip edin
          </p>
        </div>
        <Button className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Proje
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aktif Projeler"
          value={activeProjects}
          trend={20}
          trendLabel="geçen aya göre"
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Tamamlanan"
          value={completedProjects}
          trend={15}
          trendLabel="geçen aya göre"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Toplam Bütçe"
          value={`₺${(totalBudget / 1000).toFixed(0)}K`}
          trend={32}
          trendLabel="geçen aya göre"
          icon={Calendar}
          variant="default"
        />
        <StatCard
          title="Ortalama İlerleme"
          value={`%${avgProgress}`}
          trend={8}
          trendLabel="geçen aya göre"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProjectsStatusChart />
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>Proje Zaman Çizelgesi</CardTitle>
            <CardDescription>Yaklaşan deadline&apos;lar ve önemli tarihler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects
                .filter((p) => p.status !== 'completed')
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 4)
                .map((project) => (
                  <div key={project.id} className="flex items-center gap-4">
                    <div className={cn('w-2 h-12 rounded-full', statusConfig[project.status].bg)} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{project.name}</p>
                        <Badge variant="outline" className={priorityColors[project.priority]}>
                          {priorityLabels[project.priority]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{project.client}</span>
                        <span>•</span>
                        <span>{new Date(project.deadline).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                    <div className="w-24">
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card className="glass">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Projeler</CardTitle>
              <Tabs defaultValue="all" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Tümü</TabsTrigger>
                  <TabsTrigger value="active">Aktif</TabsTrigger>
                  <TabsTrigger value="completed">Tamamlandı</TabsTrigger>
                  <TabsTrigger value="pending">Bekleyen</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Proje ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-3'
          )}>
            {filteredProjects.map((project) => {
              const StatusIcon = statusConfig[project.status].icon;
              return (
                <div
                  key={project.id}
                  className={cn(
                    'group cursor-pointer transition-all',
                    viewMode === 'grid' 
                      ? 'p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg' 
                      : 'flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center rounded-xl',
                    viewMode === 'grid' ? 'w-12 h-12 mb-3' : 'w-10 h-10',
                    statusConfig[project.status].bg
                  )}>
                    <StatusIcon className={cn('h-5 w-5', statusConfig[project.status].color)} />
                  </div>
                  
                  <div className={cn('flex-1', viewMode === 'grid' && 'text-center')}>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                  </div>

                  {viewMode === 'list' && (
                    <>
                      <Badge variant="outline" className={priorityColors[project.priority]}>
                        {priorityLabels[project.priority]}
                      </Badge>
                      <div className="w-32">
                        <Progress value={project.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center mt-1">
                          %{project.progress}
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {project.team.map((member) => (
                          <Avatar key={member.name} className="h-8 w-8 border-2 border-background">
                            <AvatarFallback className="text-xs bg-primary/10">
                              {member.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground w-24">
                        {new Date(project.deadline).toLocaleDateString('tr-TR')}
                      </p>
                    </>
                  )}

                  {viewMode === 'grid' && (
                    <>
                      <div className="mt-4">
                        <Progress value={project.progress} className="h-2" />
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-muted-foreground">İlerleme</span>
                          <span className="font-medium">%{project.progress}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                        <div className="flex -space-x-2">
                          {project.team.map((member) => (
                            <Avatar key={member.name} className="h-7 w-7 border-2 border-background">
                              <AvatarFallback className="text-xs bg-primary/10">
                                {member.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(project.deadline).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
