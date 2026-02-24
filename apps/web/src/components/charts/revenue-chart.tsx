'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const formatTooltipValue = (value: number | undefined): [string, string] => {
  return [`₺${(value ?? 0).toLocaleString()}`, ''];
};

const data = [
  { month: 'Oca', revenue: 12500, target: 15000 },
  { month: 'Şub', revenue: 18200, target: 16000 },
  { month: 'Mar', revenue: 15800, target: 17000 },
  { month: 'Nis', revenue: 22400, target: 18000 },
  { month: 'May', revenue: 28900, target: 20000 },
  { month: 'Haz', revenue: 34100, target: 22000 },
  { month: 'Tem', revenue: 38200, target: 24000 },
  { month: 'Ağu', revenue: 36500, target: 26000 },
  { month: 'Eyl', revenue: 42800, target: 28000 },
  { month: 'Eki', revenue: 48500, target: 30000 },
  { month: 'Kas', revenue: 52100, target: 32000 },
  { month: 'Ara', revenue: 56800, target: 35000 },
];

export function RevenueChart() {
  return (
    <Card className="glass col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Gelir Analizi</CardTitle>
            <CardDescription>Aylık gelir ve hedef karşılaştırması</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-success">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">+24.5%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.20 250)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.55 0.20 250)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.68 0.18 70)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="oklch(0.68 0.18 70)" stopOpacity={0} />
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
                tickFormatter={(value: number) => `₺${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0 / 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid oklch(0 0 0 / 0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px -2px oklch(0 0 0 / 0.1)',
                }}
                formatter={formatTooltipValue}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.55 0.20 250)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Gelir"
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="oklch(0.68 0.18 70)"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorTarget)"
                name="Hedef"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
