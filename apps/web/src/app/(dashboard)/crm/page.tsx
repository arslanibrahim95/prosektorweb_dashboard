'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Building2,
  Filter,
  Download,
} from 'lucide-react';
import { ClientGrowthChart } from '@/components/charts/client-growth-chart';
import { StatCard } from '@/components/charts/stat-card';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive' | 'lead';
  projects: number;
  revenue: number;
  lastContact: string;
  avatar?: string;
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@techcorp.com',
    phone: '+90 532 123 4567',
    company: 'TechCorp',
    status: 'active',
    projects: 5,
    revenue: 125000,
    lastContact: '2 gün önce',
  },
  {
    id: '2',
    name: 'Zeynep Kaya',
    email: 'zeynep@designstudio.com',
    phone: '+90 533 987 6543',
    company: 'Design Studio',
    status: 'active',
    projects: 3,
    revenue: 85000,
    lastContact: '1 hafta önce',
  },
  {
    id: '3',
    name: 'Mehmet Demir',
    email: 'mehmet@startup.io',
    phone: '+90 534 456 7890',
    company: 'Startup.io',
    status: 'lead',
    projects: 0,
    revenue: 0,
    lastContact: '3 gün önce',
  },
  {
    id: '4',
    name: 'Ayşe Şahin',
    email: 'ayse@marketing.com',
    phone: '+90 535 789 0123',
    company: 'Marketing Pro',
    status: 'active',
    projects: 8,
    revenue: 210000,
    lastContact: 'Dün',
  },
  {
    id: '5',
    name: 'Can Özkan',
    email: 'can@ecommerce.com',
    phone: '+90 536 321 6547',
    company: 'E-Commerce Ltd.',
    status: 'inactive',
    projects: 2,
    revenue: 45000,
    lastContact: '2 ay önce',
  },
];

const statusColors = {
  active: 'bg-success/20 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted-foreground/30',
  lead: 'bg-warning/20 text-warning border-warning/30',
};

const statusLabels = {
  active: 'Aktif',
  inactive: 'Pasif',
  lead: 'Potansiyel',
};

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients] = useState<Client[]>(mockClients);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const totalProjects = clients.reduce((sum, c) => sum + c.projects, 0);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Müşteri Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Müşterilerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <Button className="gradient-primary border-0">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Müşteri
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Müşteri"
          value={clients.length}
          trend={12}
          trendLabel="geçen aya göre"
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Aktif Müşteri"
          value={activeClients}
          trend={8}
          trendLabel="geçen aya göre"
          icon={Building2}
          variant="success"
        />
        <StatCard
          title="Toplam Proje"
          value={totalProjects}
          trend={15}
          trendLabel="geçen aya göre"
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Toplam Gelir"
          value={`₺${(totalRevenue / 1000).toFixed(0)}K`}
          trend={24}
          trendLabel="geçen aya göre"
          icon={Building2}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ClientGrowthChart />
        </div>
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>Müşteri Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-success/10">
                <p className="text-3xl font-bold text-success">
                  {clients.filter((c) => c.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Aktif</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-warning/10">
                <p className="text-3xl font-bold text-warning">
                  {clients.filter((c) => c.status === 'lead').length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Potansiyel</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted">
                <p className="text-3xl font-bold text-muted-foreground">
                  {clients.filter((c) => c.status === 'inactive').length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Pasif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="glass">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Müşteri Listesi</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Müşteri ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[300px]"
                  aria-label="Müşteri ara"
                />
              </div>
              <Button variant="outline" size="icon" aria-label="Filtrele">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="İndir">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table role="table" aria-label="Müşteri listesi">
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Şirket</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Projeler</TableHead>
                <TableHead>Gelir</TableHead>
                <TableHead>Son İletişim</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={client.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {client.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {client.company}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[client.status]}>
                      {statusLabels[client.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.projects}</TableCell>
                  <TableCell>
                    {client.revenue > 0
                      ? `₺${client.revenue.toLocaleString()}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.lastContact}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="İşlemler">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Detaylar</DropdownMenuItem>
                        <DropdownMenuItem>Düzenle</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
