'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const data = [
  { day: 'Pzt', visits: 4200, unique: 3200 },
  { day: 'Sal', visits: 5100, unique: 3800 },
  { day: 'Çar', visits: 4800, unique: 3600 },
  { day: 'Per', visits: 6200, unique: 4500 },
  { day: 'Cum', visits: 7500, unique: 5200 },
  { day: 'Cmt', visits: 3800, unique: 2900 },
  { day: 'Paz', visits: 3200, unique: 2400 },
];

export function TrafficChart() {
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Site Trafiği</CardTitle>
        <CardDescription>Haftalık ziyaretçi istatistikleri</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 0.05)" />
              <XAxis 
                dataKey="day" 
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
              <Bar 
                dataKey="visits" 
                fill="oklch(0.55 0.20 250)" 
                radius={[4, 4, 0, 0]}
                name="Toplam Ziyaret"
              />
              <Bar 
                dataKey="unique" 
                fill="oklch(0.65 0.16 250)" 
                radius={[4, 4, 0, 0]}
                name="Benzersiz"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
