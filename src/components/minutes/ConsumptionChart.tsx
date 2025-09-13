import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConsumptionData {
  date: string;
  minutes: number;
}

interface ConsumptionChartProps {
  data?: ConsumptionData[];
  className?: string;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({
  data = [],
  className = ""
}) => {
  // Generate last 30 days data (mock data if no real data provided)
  const generateMockData = () => {
    const mockData: ConsumptionData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      mockData.push({
        date: format(date, 'yyyy-MM-dd'),
        minutes: Math.floor(Math.random() * 50) + 10 // 10-60 minutes random
      });
    }
    return mockData;
  };

  const chartData = data.length > 0 ? data : generateMockData();
  
  // Calculate prediction
  const avgDaily = chartData.reduce((sum, d) => sum + d.minutes, 0) / chartData.length;
  const currentMinutes = 150; // This should come from props or context
  const daysRemaining = Math.floor(currentMinutes / avgDaily);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Consommation des 30 derniers jours</span>
          <div className="text-sm text-muted-foreground">
            Moy: {Math.round(avgDaily)} min/jour
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: fr })}
                formatter={(value: number) => [`${value} minutes`, 'Consommées']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="minutes" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Prediction */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(avgDaily)}</div>
              <div className="text-sm text-muted-foreground">Minutes/jour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {daysRemaining > 0 ? `~${daysRemaining}j` : '0j'}
              </div>
              <div className="text-sm text-muted-foreground">Autonomie estimée</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};