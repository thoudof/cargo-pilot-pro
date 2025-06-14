import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Filter, TrendingUp, TrendingDown, Clock, DollarSign, Calculator, Target, FileExport } from 'lucide-react';
import { useDataCache } from '@/hooks/useDataCache';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';
import { Trip, TripStatus } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface TripWithExpenses extends Trip {
  totalExpenses: number;
  actualProfit: number;
  potentialProfit: number;
  isProfitActual: boolean;
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

// Вспомогательная функция для экранирования данных для CSV
const escapeCsvCell = (cellData: any): string => {
  const stringData = String(cellData === null || cellData === undefined ? '' : cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
};

export const TripsReportTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('departureDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

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
      
      // Расчет прибыли в зависимости от статуса
      let actualProfit = 0;
      let potentialProfit = 0;
      let isProfitActual = false;

      switch (trip.status) {
        case TripStatus.COMPLETED:
          // Завершенные рейсы - фактическая прибыль
          actualProfit = revenue - totalExpenses;
          isProfitActual = true;
          break;
        case TripStatus.CANCELLED:
          // Отмененные рейсы - только расходы (отрицательная прибыль)
          actualProfit = -totalExpenses;
          isProfitActual = true;
          break;
        case TripStatus.IN_PROGRESS:
        case TripStatus.PLANNED:
          // Запланированные и в процессе - потенциальная прибыль
          potentialProfit = revenue - totalExpenses;
          break;
      }
      
      return {
        ...trip,
        totalExpenses,
        actualProfit,
        potentialProfit,
        isProfitActual
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
        case 'revenue':
          aValue = a.cargo?.value || 0;
          bValue = b.cargo?.value || 0;
          break;
        case 'expenses':
          aValue = a.totalExpenses;
          bValue = b.totalExpenses;
          break;
        case 'actualProfit':
          aValue = a.actualProfit;
          bValue = b.actualProfit;
          break;
        case 'potentialProfit':
          aValue = a.potentialProfit;
          bValue = b.potentialProfit;
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
    // Разделение по статусам для точного подсчета
    const completedTrips = filteredAndSortedTrips.filter(trip => trip.status === TripStatus.COMPLETED);
    const cancelledTrips = filteredAndSortedTrips.filter(trip => trip.status === TripStatus.CANCELLED);
    const activeTrips = filteredAndSortedTrips.filter(trip => 
      trip.status === TripStatus.IN_PROGRESS || trip.status === TripStatus.PLANNED
    );

    // Фактические показатели (завершенные + отмененные)
    const actualRevenue = completedTrips.reduce((sum, trip) => sum + (trip.cargo?.value || 0), 0);
    const actualExpenses = [...completedTrips, ...cancelledTrips].reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const actualProfit = completedTrips.reduce((sum, trip) => sum + trip.actualProfit, 0) + 
                        cancelledTrips.reduce((sum, trip) => sum + trip.actualProfit, 0);

    // Потенциальные показатели (планируемые + в процессе)
    const potentialRevenue = activeTrips.reduce((sum, trip) => sum + (trip.cargo?.value || 0), 0);
    const potentialExpenses = activeTrips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const potentialProfit = activeTrips.reduce((sum, trip) => sum + trip.potentialProfit, 0);

    // Общие показатели
    const totalRevenue = actualRevenue + potentialRevenue;
    const totalExpenses = actualExpenses + potentialExpenses;
    const totalWeight = filteredAndSortedTrips.reduce((sum, trip) => sum + (trip.cargo?.weight || 0), 0);
    
    // Рентабельность
    const actualProfitMargin = actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0;
    const potentialProfitMargin = potentialRevenue > 0 ? (potentialProfit / potentialRevenue) * 100 : 0;
    const overallProfitMargin = totalRevenue > 0 ? ((actualProfit + potentialProfit) / totalRevenue) * 100 : 0;
    
    return {
      totalTrips: filteredAndSortedTrips.length,
      completedTrips: completedTrips.length,
      activeTrips: activeTrips.length,
      cancelledTrips: cancelledTrips.length,
      
      actualRevenue,
      actualExpenses,
      actualProfit,
      
      potentialRevenue,
      potentialExpenses,
      potentialProfit,
      
      totalRevenue,
      totalExpenses,
      totalWeight: totalWeight / 1000, // в тоннах
      
      actualProfitMargin,
      potentialProfitMargin,
      overallProfitMargin
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

  const handleExport = () => {
    if (filteredAndSortedTrips.length === 0) {
      toast({
        title: "Нет данных для экспорта",
        description: "Пожалуйста, измените фильтры или дождитесь появления данных.",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      "№", "Маршрут", "Описание груза", "Дата отправления", "Водитель Имя", 
      "Водитель Телефон", "ТС Марка", "ТС Модель", "ТС Госномер", "Контрагент", 
      "Вес (кг)", "Объем (м³)", "Доход (₽)", "Расходы (₽)", 
      "Факт. прибыль (₽)", "Потенц. прибыль (₽)", "Статус"
    ];

    const csvRows = [
      headers.join(','),
      ...filteredAndSortedTrips.map((trip, index) => {
        const row = [
          index + 1,
          `${trip.pointA} → ${trip.pointB}`,
          trip.cargo?.description || '',
          format(new Date(trip.departureDate), 'dd.MM.yyyy', { locale: ru }),
          trip.driver.name,
          trip.driver.phone,
          trip.vehicle.brand,
          trip.vehicle.model,
          trip.vehicle.licensePlate,
          contractors[trip.contractorId] || 'Неизвестный',
          trip.cargo?.weight || 0,
          trip.cargo?.volume || 0,
          trip.cargo?.value || 0,
          trip.totalExpenses,
          trip.isProfitActual ? trip.actualProfit : '',
          !trip.isProfitActual ? trip.potentialProfit : '',
          statusLabels[trip.status]
        ];
        return row.map(escapeCsvCell).join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for BOM for Excel
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trips_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Экспорт успешно завершен",
      description: "Данные по рейсам выгружены в CSV файл.",
    });
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
      {/* Расширенная сводная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Общая статистика */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Всего рейсов</div>
            <div className="text-2xl font-bold">{summaryStats.totalTrips}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Завершено: {summaryStats.completedTrips} | Активных: {summaryStats.activeTrips} | Отменено: {summaryStats.cancelledTrips}
            </div>
          </CardContent>
        </Card>

        {/* Фактическая прибыль */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div className="text-sm text-muted-foreground">Фактическая прибыль</div>
            </div>
            <div className={`text-2xl font-bold ${summaryStats.actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryStats.actualProfit.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Рентабельность: {summaryStats.actualProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* Потенциальная прибыль */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-muted-foreground">Потенциальная прибыль</div>
            </div>
            <div className={`text-2xl font-bold ${summaryStats.potentialProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {summaryStats.potentialProfit.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Ожидаемая рентабельность: {summaryStats.potentialProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* Общие доходы */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <div className="text-sm text-muted-foreground">Общие доходы</div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {summaryStats.totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Факт: {summaryStats.actualRevenue.toLocaleString('ru-RU')} ₽ | План: {summaryStats.potentialRevenue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        {/* Общие расходы */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div className="text-sm text-muted-foreground">Общие расходы</div>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {summaryStats.totalExpenses.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Факт: {summaryStats.actualExpenses.toLocaleString('ru-RU')} ₽ | План: {summaryStats.potentialExpenses.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        {/* Общий вес */}
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Общий вес</div>
            <div className="text-2xl font-bold">
              {summaryStats.totalWeight.toFixed(1)} т
            </div>
          </CardContent>
        </Card>

        {/* Общая рентабельность */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-purple-600" />
              <div className="text-sm text-muted-foreground">Общая рентабельность</div>
            </div>
            <div className={`text-2xl font-bold ${summaryStats.overallProfitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {summaryStats.overallProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* Итоговая прибыль */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <div className="text-sm text-muted-foreground">Итоговая прибыль</div>
            </div>
            <div className={`text-2xl font-bold ${(summaryStats.actualProfit + summaryStats.potentialProfit) >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {(summaryStats.actualProfit + summaryStats.potentialProfit).toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Факт + Потенциал
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Детальная таблица рейсов</span>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileExport className="h-4 w-4 mr-2" />
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
                    onClick={() => handleSort('actualProfit')}
                  >
                    Фактическая прибыль
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('potentialProfit')}
                  >
                    Потенциальная прибыль
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
                    <TableCell className={`text-right font-medium ${
                      trip.isProfitActual 
                        ? (trip.actualProfit >= 0 ? 'text-green-600' : 'text-red-600')
                        : 'text-gray-400'
                    }`}>
                      {trip.isProfitActual ? `${trip.actualProfit.toLocaleString('ru-RU')} ₽` : '—'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      !trip.isProfitActual 
                        ? (trip.potentialProfit >= 0 ? 'text-blue-600' : 'text-orange-600')
                        : 'text-gray-400'
                    }`}>
                      {!trip.isProfitActual ? `${trip.potentialProfit.toLocaleString('ru-RU')} ₽` : '—'}
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
