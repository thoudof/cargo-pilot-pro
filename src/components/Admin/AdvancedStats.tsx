import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseService } from '@/services/supabaseService';
import { ExpenseStats } from '@/components/Dashboard/ExpenseStats';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Truck, Calendar, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, subDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StatsData {
  activeTrips: number;
  totalTrips: number;
  completedTrips: number;
  plannedTrips: number;
  cancelledTrips: number;
  contractors: number;
  drivers: number;
  vehicles: number;
  totalCargoValue: number;
  completedCargoValue: number;
  totalWeight: number;
  totalVolume: number;
  averageCargoValue: number;
  completionRate: number;
  totalExpenses: number;
  completedTripsExpenses: number;
  expensesByType: Record<string, number>;
  profit: number;
  profitMargin: number;
  averageExpensePerTrip: number;
  monthlyStats: Array<{
    month: string;
    trips: number;
    revenue: number;
    weight: number;
    expenses: number;
  }>;
  topRoutes: Array<{
    route: string;
    count: number;
    revenue: number;
  }>;
  driverPerformance: Array<{
    driverId: string;
    driverName: string;
    tripsCount: number;
    totalRevenue: number;
    totalExpenses: number;
  }>;
  vehicleUtilization: Array<{
    vehicleId: string;
    vehicleName: string;
    tripsCount: number;
    totalKm: number;
    totalRevenue: number;
  }>;
}

export const AdvancedStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
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
    averageCargoValue: 0,
    completionRate: 0,
    totalExpenses: 0,
    completedTripsExpenses: 0,
    expensesByType: {},
    profit: 0,
    profitMargin: 0,
    averageExpensePerTrip: 0,
    monthlyStats: [],
    topRoutes: [],
    driverPerformance: [],
    vehicleUtilization: []
  });
  
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    } as DateRange,
    status: 'all',
    contractorId: 'all',
    driverId: 'all'
  });

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getAdvancedStats(filters);
      setStats(data);
    } catch (error) {
      console.error('Failed to load advanced stats:', error);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Период</label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(range) => setFilters({ ...filters, dateRange: range || { from: subDays(new Date(), 30), to: new Date() } })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Статус</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="planned">Планируется</SelectItem>
                  <SelectItem value="in_progress">В пути</SelectItem>
                  <SelectItem value="completed">Завершён</SelectItem>
                  <SelectItem value="cancelled">Отменён</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Заказчик</label>
              <Select 
                value={filters.contractorId} 
                onValueChange={(value) => setFilters({ ...filters, contractorId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все заказчики</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Водитель</label>
              <Select 
                value={filters.driverId} 
                onValueChange={(value) => setFilters({ ...filters, driverId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все водители</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="expenses">Расходы</TabsTrigger>
          <TabsTrigger value="performance">Производительность</TabsTrigger>
          <TabsTrigger value="routes">Маршруты</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalCargoValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Завершено: {formatCurrency(stats.completedCargoValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего рейсов</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTrips}</div>
                <p className="text-xs text-muted-foreground">
                  Завершено: {stats.completedTrips} ({formatPercentage(stats.completionRate)})
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общий вес</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWeight.toLocaleString('ru-RU')} кг</div>
                <p className="text-xs text-muted-foreground">
                  Объем: {stats.totalVolume.toLocaleString('ru-RU')} м³
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средняя стоимость</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageCargoValue)}</div>
                <p className="text-xs text-muted-foreground">За рейс</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseStats stats={stats} formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Производительность водителей</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.driverPerformance.map((driver) => (
                    <div key={driver.driverId} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{driver.driverName}</p>
                        <p className="text-sm text-muted-foreground">
                          {driver.tripsCount} рейсов
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(driver.totalRevenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          Расходы: {formatCurrency(driver.totalExpenses)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Использование транспорта</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.vehicleUtilization.map((vehicle) => (
                    <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{vehicle.vehicleName}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.tripsCount} рейсов
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(vehicle.totalRevenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.totalKm.toLocaleString('ru-RU')} км
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Популярные маршруты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{route.route}</p>
                      <p className="text-sm text-muted-foreground">
                        {route.count} рейсов
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(route.revenue)}</p>
                      <Badge variant="outline">
                        {formatCurrency(route.revenue / route.count)} за рейс
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
