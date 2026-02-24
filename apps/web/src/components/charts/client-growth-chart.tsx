'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';

const data = [
  { month: 'Oca', clients: 45, new: 8 },
  { month: 'Şub', clients: 52, new: 7 },
  { month: 'Mar', clients: 61, new: 9 },
  { month: 'Nis', clients: 68, new: 7 },
  { month: 'May', clients: 78, new: 10 },
  { month: 'Haz', clients: 89, new: 11 },
];

export function ClientGrowthChart() {
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Müşteri Büyümesi</CardTitle>
            <CardDescription>Aktif müşteri sayısı artışı</CardDescription>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.24 160)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.55 0.24 160)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 0.05)" />
              <XAxis 
                dataKey="month" 
                stroke="oklch(0 0 0 / 0.3)" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="oklch(0 0 0 / 0.3)" 
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0 / 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid oklch(0 0 0 / 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="clients"
                stroke="oklch(0.55 0.24 160)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClients)"
                name="Toplam Müşteri"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-2xl font-bold">89</p>
            <p className="text-xs text-muted-foreground">Aktif Müşteri</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-success">+11</p>
            <p className="text-xs text-muted-foreground">Bu ay yeni</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
