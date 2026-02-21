'use client';

import { useMemo, useState } from 'react';
import type { PlatformTenantSummary } from '@prosektor/contracts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { UnauthorizedScreen } from '@/components/layout/role-guard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import {
  useCreatePlatformTenant,
  usePlatformTenantDangerAction,
  usePlatformTenants,
  useUpdatePlatformTenant,
} from '@/hooks/use-admin';
import { toast } from 'sonner';

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'suspended') return 'secondary';
  if (status === 'deleted') return 'destructive';
  return 'outline';
}

export default function PlatformTenantsPage() {
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [plan, setPlan] = useState<string>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformTenantSummary | null>(null);
  const [dangerTarget, setDangerTarget] = useState<PlatformTenantSummary | null>(null);
  const [dangerAction, setDangerAction] = useState<'suspend' | 'reactivate' | 'soft_delete'>('suspend');
  const [dangerReason, setDangerReason] = useState('');
  const [dangerConfirmationText, setDangerConfirmationText] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    plan: 'demo' as 'demo' | 'starter' | 'pro',
    owner_email: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    plan: 'demo' as 'demo' | 'starter' | 'pro',
    status: 'active' as 'active' | 'suspended' | 'deleted',
  });

  const tenantQuery = usePlatformTenants({
    page: 1,
    limit: 100,
    search: search.trim() || undefined,
    status: status === 'all' ? undefined : status,
    plan: plan === 'all' ? undefined : plan,
  });

  const createMutation = useCreatePlatformTenant();
  const updateMutation = useUpdatePlatformTenant();
  const dangerMutation = usePlatformTenantDangerAction();

  const tenants = tenantQuery.data?.items ?? [];
  const total = tenantQuery.data?.total ?? 0;

  const selectedDangerActionLabel = useMemo(() => {
    if (dangerAction === 'suspend') return 'Suspend';
    if (dangerAction === 'reactivate') return 'Reactivate';
    return 'Soft Delete';
  }, [dangerAction]);

  if (auth.me?.role !== 'super_admin') {
    return <UnauthorizedScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Tenant Yönetimi</h1>
          <p className="text-muted-foreground">Tenant oluşturma, güncelleme ve yıkıcı aksiyonlar.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Yeni Tenant</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>Toplam {total} tenant listeleniyor.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Tenant adı veya slug"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger>
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Planlar</SelectItem>
              <SelectItem value="demo">Demo</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Yükleniyor...</div>
          ) : tenantQuery.error ? (
            <div className="text-sm text-destructive">Tenant listesi yüklenemedi.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                    </TableCell>
                    <TableCell className="uppercase">{tenant.plan}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(tenant.status)}>{tenant.status}</Badge>
                    </TableCell>
                    <TableCell>{tenant.owners_count}</TableCell>
                    <TableCell>{tenant.sites_count}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <span className="sr-only">İşlemler</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setEditTarget(tenant);
                            setEditForm({
                              name: tenant.name,
                              slug: tenant.slug,
                              plan: tenant.plan,
                              status: tenant.status,
                            });
                          }}>
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {tenant.status === 'active' ? (
                            <DropdownMenuItem
                              className="text-yellow-600"
                              onClick={() => {
                                setDangerTarget(tenant);
                                setDangerAction('suspend');
                                setDangerReason('');
                                setDangerConfirmationText('');
                              }}
                            >
                              Askıya Al
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => {
                                setDangerTarget(tenant);
                                setDangerAction('reactivate');
                                setDangerReason('');
                                setDangerConfirmationText('');
                              }}
                            >
                              Yeniden Aktive Et
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDangerTarget(tenant);
                              setDangerAction('soft_delete');
                              setDangerReason('');
                              setDangerConfirmationText('');
                            }}
                          >
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Tenant Oluştur</DialogTitle>
            <DialogDescription>Tenant + owner daveti aynı işlemde oluşturulur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Tenant adı"
              value={createForm.name}
              onChange={(event) => {
                const name = event.target.value;
                setCreateForm((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slug.length > 0 ? prev.slug : name.toLowerCase().replace(/\s+/g, '-'),
                }));
              }}
            />
            <Input
              placeholder="slug"
              value={createForm.slug}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))}
            />
            <Input
              placeholder="owner email"
              type="email"
              value={createForm.owner_email}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, owner_email: event.target.value }))
              }
            />
            <Select
              value={createForm.plan}
              onValueChange={(value: 'demo' | 'starter' | 'pro') =>
                setCreateForm((prev) => ({ ...prev, plan: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>İptal</Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => {
                createMutation.mutate(createForm, {
                  onSuccess: () => {
                    toast.success('Tenant oluşturuldu');
                    setCreateOpen(false);
                    setCreateForm({ name: '', slug: '', plan: 'demo', owner_email: '' });
                  },
                  onError: (error) => {
                    toast.error(error instanceof Error ? error.message : 'Tenant oluşturulamadı');
                  },
                });
              }}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tenant Güncelle</DialogTitle>
            <DialogDescription>{editTarget?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Tenant adı"
              value={editForm.name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              placeholder="slug"
              value={editForm.slug}
              onChange={(event) => setEditForm((prev) => ({ ...prev, slug: event.target.value }))}
            />
            <Select
              value={editForm.plan}
              onValueChange={(value: 'demo' | 'starter' | 'pro') =>
                setEditForm((prev) => ({ ...prev, plan: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={editForm.status}
              onValueChange={(value: 'active' | 'suspended' | 'deleted') =>
                setEditForm((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>İptal</Button>
            <Button
              disabled={updateMutation.isPending || !editTarget}
              onClick={() => {
                if (!editTarget) return;
                updateMutation.mutate(
                  {
                    id: editTarget.id,
                    data: {
                      name: editForm.name,
                      slug: editForm.slug,
                      plan: editForm.plan,
                      status: editForm.status,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success('Tenant güncellendi');
                      setEditTarget(null);
                    },
                    onError: (error) => {
                      toast.error(error instanceof Error ? error.message : 'Tenant güncellenemedi');
                    },
                  },
                );
              }}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dangerTarget} onOpenChange={(open) => !open && setDangerTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Danger Action</DialogTitle>
            <DialogDescription>
              {dangerTarget?.name} için bu işlem geri döndürülemez etkiye sahip olabilir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={dangerAction}
              onValueChange={(value: 'suspend' | 'reactivate' | 'soft_delete') =>
                setDangerAction(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suspend">Suspend</SelectItem>
                <SelectItem value="reactivate">Reactivate</SelectItem>
                <SelectItem value="soft_delete">Soft Delete</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={`Onay için slug yazın: ${dangerTarget?.slug ?? ''}`}
              value={dangerConfirmationText}
              onChange={(event) => setDangerConfirmationText(event.target.value)}
            />
            <Textarea
              placeholder="Reason (en az 10 karakter)"
              value={dangerReason}
              onChange={(event) => setDangerReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDangerTarget(null)}>İptal</Button>
            <Button
              variant="destructive"
              disabled={dangerMutation.isPending || !dangerTarget}
              onClick={() => {
                if (!dangerTarget) return;
                dangerMutation.mutate(
                  {
                    id: dangerTarget.id,
                    action: dangerAction,
                    confirmation_text: dangerConfirmationText,
                    reason: dangerReason,
                  },
                  {
                    onSuccess: () => {
                      toast.success(`${selectedDangerActionLabel} işlemi tamamlandı`);
                      setDangerTarget(null);
                    },
                    onError: (error) => {
                      toast.error(error instanceof Error ? error.message : 'Danger action başarısız');
                    },
                  },
                );
              }}
            >
              {selectedDangerActionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
