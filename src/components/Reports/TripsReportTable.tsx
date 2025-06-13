
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Filter } from 'lucide-react';
import { useDataCache } from '@/hooks/useDataCache';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';
import { Trip, TripStatus } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripWithExpenses extends Trip {
  totalExpenses: number;
  profit: number;
}

const statusLabels = {
  [TripStatus.PLANNED]: 'Планируется',
  [TripStatus.IN_PROGRESS]: 'В пути',
  [TripStatus.COMPLETED]: 'Завершён',
  [TripStatus.CANCELLED]: 'Отменён'
};

const statusColors = {
  [TripStatus.PLANNED]: 'bg-blue-500',
  [TripStatus.IN_PROGRESS]: 'bg-yellow-500',
  [TripStatus.COMPLETED]: 'bg-green-500',
  [TripStatus.CANCELLED]: 'bg-red-500'
};

export const TripsReportTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('departureDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: trips = [], loading } = useDataCache<Trip[]>(
    'trips-report',
    async () => {
      const result = await optimizedSupabaseService.getTripsOptimized(1000);
      return Array.isArray(result) ? result : [];
    },
    { ttl: 2 * 60 * 1000 }
  );

  const { data: contractors = {} } = useDataCache<Record<string, string>>(
    'contractors-names',
    async () => {
      const { data, error } = await optimizedSupabaseService.supabase
        .from('contractors')
        .select('id, company_name');
      if (error) throw error;
      return data.reduce((acc, c) => {
        acc[c.id] = c.company_name;
        return acc;
      }, {} as Record<string, string>);
    },
    { ttl: 5 * 60 * 1000 }
  );

  const { data: expensesData = {} } = useDataCache<Record<string, number>>(
    'trips-expenses',
    async () => {
      if (trips.length === 0) return {};
      const tripIds = trips.map(trip => trip.id);
      return await optimizedSupabaseService.getTripExpensesBatch(tripIds);
    },
    { ttl: 2 * 60 * 1000 }
  );

  const processedTrips = useMemo((): TripWithExpenses[] => {
    return trips.map(trip => {
      const totalExpenses = expensesData[trip.id] || 0;
      const revenue = trip.cargo?.value || 0;
      const profit = revenue - totalExpenses;
      
      return {
        ...trip,
        totalExpenses,
        profit
      };
    });
  }, [trips, expensesData]);

  const filteredAndSortedTrips = useMemo(() => {
    let result = processedTrips;

    // Фильтрация по поиску
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(trip => 
        trip.pointA.toLowerCase().includes(searchLower) ||
        trip.pointB.toLowerCase().includes(searchLower) ||
        trip.driver.name.toLowerCase().includes(searchLower) ||
        trip.vehicle.licensePlate.toLowerCase().includes(searchLower) ||
        contractors[trip.contractorId]?.toLowerCase().includes(searchLower)
      );
    }

    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      result = result.filter(trip => trip.status === statusFilter);
    }

    // Сортировка
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'departureDate':
          aValue = new Date(a.departureDate);
          bValue = new Date(b.departureDate);
          break;
        case 'route':
          aValue = `${a.pointA} - ${a.pointB}`;
          bValue = `${b.pointA} - ${b.pointB}`;
          break;
        case 'distance':
          aValue = 0; // Можно добавить расчет расстояния
          bValue = 0;
          break;
        case 'revenue':
          aValue = a.cargo?.value || 0;
          bValue = b.cargo?.value || 0;
          break;
        case 'expenses':
          aValue = a.totalExpenses;
          bValue = b.totalExpenses;
          break;
        case 'profit':
          aValue = a.profit;
          bValue = b.profit;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [processedTrips, searchTerm, statusFilter, sortField, sortDirection, contractors]);

  const summaryStats = useMemo(() => {
    const totalRevenue = filteredAndSortedTrips.reduce((sum, trip) => sum + (trip.cargo?.value || 0), 0);
    const totalExpenses = filteredAndSortedTrips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const totalWeight = filteredAndSortedTrips.reduce((sum, trip) => sum + (trip.cargo?.weight || 0), 0);
    
    return {
      totalTrips: filteredAndSortedTrips.length,
      totalRevenue,
      totalExpenses,
      totalProfit,
      totalWeight: totalWeight / 1000, // в тоннах
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  }, [filteredAndSortedTrips]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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
    <div className="space-y-6">
      {/* Сводная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Всего рейсов</div>
            <div className="text-2xl font-bold">{summaryStats.totalTrips}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Общий доход</div>
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Общие расходы</div>
            <div className="text-2xl font-bold text-red-600">
              {summaryStats.totalExpenses.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Прибыль</div>
            <div className={`text-2xl font-bold ${summaryStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryStats.totalProfit.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Общий вес</div>
            <div className="text-2xl font-bold">
              {summaryStats.totalWeight.toFixed(1)} т
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Рентабельность</div>
            <div className={`text-2xl font-bold ${summaryStats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryStats.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Детальная таблица рейсов</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по маршруту, водителю, контрагенту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value={TripStatus.PLANNED}>Планируется</SelectItem>
                <SelectItem value={TripStatus.IN_PROGRESS}>В пути</SelectItem>
                <SelectItem value={TripStatus.COMPLETED}>Завершён</SelectItem>
                <SelectItem value={TripStatus.CANCELLED}>Отменён</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('route')}
                  >
                    Маршрут
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('departureDate')}
                  >
                    Дата отправления
                  </TableHead>
                  <TableHead>Водитель</TableHead>
                  <TableHead>Транспорт</TableHead>
                  <TableHead>Контрагент</TableHead>
                  <TableHead>Вес/Объем</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('revenue')}
                  >
                    Доход
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('expenses')}
                  >
                    Расходы
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('profit')}
                  >
                    Прибыль
                  </TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTrips.map((trip, index) => (
                  <TableRow key={trip.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{trip.pointA} → {trip.pointB}</div>
                      <div className="text-sm text-muted-foreground">
                        {trip.cargo?.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.departureDate), 'dd.MM.yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <div>{trip.driver.name}</div>
                      <div className="text-sm text-muted-foreground">{trip.driver.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div>{trip.vehicle.brand} {trip.vehicle.model}</div>
                      <div className="text-sm text-muted-foreground">{trip.vehicle.licensePlate}</div>
                    </TableCell>
                    <TableCell>
                      {contractors[trip.contractorId] || 'Неизвестный'}
                    </TableCell>
                    <TableCell>
                      <div>{(trip.cargo?.weight || 0).toLocaleString('ru-RU')} кг</div>
                      <div className="text-sm text-muted-foreground">
                        {(trip.cargo?.volume || 0).toLocaleString('ru-RU')} м³
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {(trip.cargo?.value || 0).toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {trip.totalExpenses.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className={`text-right font-medium ${trip.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trip.profit.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[trip.status]} text-white border-none`}
                      >
                        {statusLabels[trip.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedTrips.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Не найдено рейсов по заданным критериям'
                  : 'Нет данных о рейсах'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
