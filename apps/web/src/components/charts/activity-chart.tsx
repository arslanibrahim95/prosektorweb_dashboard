'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const data = [
  { time: '08:00', activity: 12 },
  { time: '10:00', activity: 28 },
  { time: '12:00', activity: 45 },
  { time: '14:00', activity: 38 },
  { time: '16:00', activity: 52 },
  { time: '18:00', activity: 35 },
  { time: '20:00', activity: 22 },
  { time: '22:00', activity: 15 },
];

export function ActivityChart() {
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Günlük Aktivite</CardTitle>
        <CardDescription>Saatlik kullanıcı etkileşimi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 0.05)" />
              <XAxis 
                dataKey="time" 
                stroke="oklch(0 0 0 / 0.3)" 
                fontSize={11}
                tickLine={false}
              />
              <YAxis 
                stroke="oklch(0 0 0 / 0.3)" 
                fontSize={11}
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
              <Line 
                type="monotone" 
                dataKey="activity" 
                stroke="oklch(0.55 0.24 160)" 
                strokeWidth={2}
                dot={{ fill: 'oklch(0.55 0.24 160)', strokeWidth: 0, r: 4 }}
                name="Aktivite"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
