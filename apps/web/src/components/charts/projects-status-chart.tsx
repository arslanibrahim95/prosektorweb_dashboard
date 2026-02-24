'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const data = [
  { name: 'Devam Eden', value: 12, color: 'oklch(0.55 0.20 250)' },
  { name: 'Tamamlanan', value: 28, color: 'oklch(0.55 0.24 160)' },
  { name: 'Bekleyen', value: 5, color: 'oklch(0.68 0.18 70)' },
  { name: 'İptal', value: 2, color: 'oklch(0.55 0.22 25)' },
];

export function ProjectsStatusChart() {
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Proje Durumu</CardTitle>
        <CardDescription>Mevcut projelerin dağılımı</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0 / 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid oklch(0 0 0 / 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
              <span className="text-xs font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
