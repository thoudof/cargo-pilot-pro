
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

interface DashboardChartsProps {
  stats: {
    monthlyStats: Array<{
      month: string;
      trips: number;
      revenue: number;
      weight: number;
    }>;
  };
  formatCurrency: (value: number) => string;
  formatWeight: (value: number) => string;
  chartConfig: any;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  stats, 
  formatCurrency, 
  formatWeight, 
  chartConfig 
}) => {
  // Преобразуем данные для графиков
  const chartData = stats.monthlyStats.map(item => ({
    month: item.month,
    trips: item.trips,
    revenue: item.revenue,
    weight: Math.round(item.weight / 1000) // конвертируем в тонны
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Статистика по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
                <Bar 
                  dataKey="trips" 
                  fill="var(--color-trips)" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Выручка по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name) => [
                      formatCurrency(Number(value)), 
                      'Выручка'
                    ]}
                  />}
                  cursor={{ stroke: 'var(--color-revenue)', strokeWidth: 1 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-revenue)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-revenue)', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, stroke: 'var(--color-revenue)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
