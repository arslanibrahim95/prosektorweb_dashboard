'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlatformAnalytics } from '@/hooks/use-admin';
import { useAuth } from '@/components/auth/auth-provider';
import { UnauthorizedScreen } from '@/components/layout/role-guard';

export default function PlatformAnalyticsPage() {
  const auth = useAuth();
  const analyticsQuery = usePlatformAnalytics();

  if (auth.me?.role !== 'super_admin') {
    return <UnauthorizedScreen />;
  }

  const data = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground">Tenant bağımsız platform metrikleri.</p>
      </div>

      {analyticsQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Yükleniyor...</CardContent>
        </Card>
      ) : analyticsQuery.error || !data ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">Platform analytics yüklenemedi.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.tenants}</div>
                <p className="text-xs text-muted-foreground">
                  Active: {data.totals.active_tenants} · Suspended: {data.totals.suspended_tenants}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.active_users}</div>
                <p className="text-xs text-muted-foreground">Tenant üyeliklerinden benzersiz kullanıcı</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Site</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.sites}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Inbox Toplamı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totals.offers + data.totals.contacts + data.totals.applications}
                </div>
                <p className="text-xs text-muted-foreground">
                  Offers: {data.totals.offers} · Contacts: {data.totals.contacts} · Applications: {data.totals.applications}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Plan Dağılımı</CardTitle>
                <CardDescription>Tenant plan kırılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Tenant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.plan_distribution.map((item) => (
                      <TableRow key={item.plan}>
                        <TableCell className="uppercase">{item.plan}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Son Tenant Aktivitesi</CardTitle>
                <CardDescription>Son 30 gün activity toplamlari</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Offers</TableHead>
                      <TableHead className="text-right">Contacts</TableHead>
                      <TableHead className="text-right">Applications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent_tenant_activity.map((item) => (
                      <TableRow key={item.tenant_id}>
                        <TableCell>{item.tenant_name}</TableCell>
                        <TableCell className="text-right">{item.offers}</TableCell>
                        <TableCell className="text-right">{item.contacts}</TableCell>
                        <TableCell className="text-right">{item.applications}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
