
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, DollarSign, Package, TrendingUp, Calendar, Weight, BarChart3 } from 'lucide-react';
import { supabaseService } from '@/services/supabaseService';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeTrips: 0,
    totalTrips: 0,
    completedTrips: 0,
    plannedTrips: 0,
    cancelledTrips: 0,
    contractors: 0,
    drivers: 0,
    vehicles: 0,
    totalCargoValue: 0,
    completedCargoValue: 0,
    totalWeight: 0,
    totalVolume: 0,
    monthlyStats: [],
    averageCargoValue: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await supabaseService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toLocaleString('ru-RU')} кг`;
  };

  const tripStatusData = [
    { name: 'Активные', value: stats.activeTrips, color: '#3b82f6' },
    { name: 'Завершенные', value: stats.completedTrips, color: '#10b981' },
    { name: 'Запланированные', value: stats.plannedTrips, color: '#f59e0b' },
    { name: 'Отмененные', value: stats.cancelledTrips, color: '#ef4444' }
  ];

  const chartConfig = {
    trips: {
      label: "Рейсы",
      color: "hsl(var(--chart-1))"
    },
    revenue: {
      label: "Выручка",
      color: "hsl(var(--chart-2))"
    },
    weight: {
      label: "Вес (т)",
      color: "hsl(var(--chart-3))"
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Основные метрики - адаптивная сетка */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Активные рейсы</CardTitle>
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.activeTrips}</div>
            <p className="text-xs text-muted-foreground">из {stats.totalTrips} всего</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Контрагенты</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.contractors}</div>
            <p className="text-xs text-muted-foreground">всего</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Водители</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.drivers}</div>
            <p className="text-xs text-muted-foreground">в базе</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Транспорт</CardTitle>
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{stats.vehicles}</div>
            <p className="text-xs text-muted-foreground">в парке</p>
          </CardContent>
        </Card>
      </div>

      {/* Финансовые метрики - адаптивная сетка */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Общая стоимость грузов</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.totalCargoValue)}</div>
            <p className="text-xs text-muted-foreground">
              Завершено: {formatCurrency(stats.completedCargoValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Средняя стоимость груза</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.averageCargoValue)}</div>
            <p className="text-xs text-muted-foreground">
              Успешность: {stats.completionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Общий вес грузов</CardTitle>
            <Weight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatWeight(stats.totalWeight)}</div>
            <p className="text-xs text-muted-foreground">
              Объем: {stats.totalVolume.toLocaleString('ru-RU')} м³
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Графики - адаптивная сетка */}
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

      {/* Секция последних рейсов */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Последние рейсы</span>
          </CardTitle>
          <button className="text-xs sm:text-sm text-primary hover:underline">
            Показать все
          </button>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {stats.totalTrips === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">
              У вас пока нет рейсов
            </p>
          ) : (
            <div className="space-y-2">
              <div className="text-xs sm:text-sm">
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} p-2 border rounded`}>
                  <span>Активных рейсов: <strong>{stats.activeTrips}</strong></span>
                  <span>Завершенных: <strong>{stats.completedTrips}</strong></span>
                  <span>Запланированных: <strong>{stats.plannedTrips}</strong></span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { Dashboard };
export default Dashboard;
