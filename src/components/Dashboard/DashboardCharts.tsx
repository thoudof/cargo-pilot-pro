
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Package, Weight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardChartsProps {
  stats: {
    activeTrips: number;
    completedTrips: number;
    plannedTrips: number;
    cancelledTrips: number;
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
  const isMobile = useIsMobile();

  const tripStatusData = [
    { name: 'Активные', value: stats.activeTrips, color: '#3b82f6' },
    { name: 'Завершенные', value: stats.completedTrips, color: '#10b981' },
    { name: 'Запланированные', value: stats.plannedTrips, color: '#f59e0b' },
    { name: 'Отмененные', value: stats.cancelledTrips, color: '#ef4444' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      {/* График по месяцам */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Статистика по месяцам</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[250px] sm:h-[300px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="trips" fill="var(--color-trips)" name="Рейсы" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* График выручки */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Выручка по месяцам</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[250px] sm:h-[300px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [formatCurrency(Number(value)), 'Выручка']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-revenue)" 
                  strokeWidth={2}
                  name="Выручка"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Круговая диаграмма статусов рейсов */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Распределение рейсов по статусам</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className={`${isMobile ? 'h-[200px]' : 'h-[250px] sm:h-[300px]'} flex items-center justify-center`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tripStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 30 : 60}
                  outerRadius={isMobile ? 70 : 120}
                  dataKey="value"
                  label={isMobile ? false : ({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {tripStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Легенда для мобильных устройств */}
          {isMobile && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {tripStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* График веса грузов */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <Weight className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Вес грузов по месяцам</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[250px] sm:h-[300px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [formatWeight(Number(value)), 'Вес']}
                />
                <Bar 
                  dataKey="weight" 
                  fill="var(--color-weight)" 
                  name="Вес"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
