'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ActivityLogItem {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  created_by: string | null;
  created_at: string;
}

interface ActivityLogResponse {
  items: ActivityLogItem[];
  total: number;
}

function formatTurkishDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function useActivityLog(token: string | undefined) {
  return useQuery<ActivityLogResponse>({
    queryKey: ['activity-log'],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch('/api/settings/activity-log?limit=50', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Aktivite logu yüklenemedi');
      }
      return res.json() as Promise<ActivityLogResponse>;
    },
  });
}

export default function ActivityLogPage() {
  const auth = useAuth();
  const token = auth.session?.access_token;
  const { data, isLoading } = useActivityLog(token);

  const items = data?.items ?? [];

  return (
    <div className={cn('dashboard-page', 'stagger-children')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aktivite Logu</h1>
          <p className="text-muted-foreground mt-1">Tenant genelindeki aktiviteleri görüntüleyin</p>
        </div>
      </div>

      <Card className="glass border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            Son Aktiviteler
          </CardTitle>
          <CardDescription>
            {data ? `Toplam ${data.total} kayıt` : 'Yükleniyor...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Henüz aktivite kaydı bulunamadı.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Eylem</th>
                    <th className="text-left py-2 pr-4 font-medium">Varlık Türü</th>
                    <th className="text-left py-2 pr-4 font-medium">Varlık ID</th>
                    <th className="text-left py-2 pr-4 font-medium">Oluşturan</th>
                    <th className="text-left py-2 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-medium text-foreground">{item.action}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{item.entity_type ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">
                        {item.entity_id ? item.entity_id.slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">
                        {item.created_by ? item.created_by.slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{formatTurkishDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
