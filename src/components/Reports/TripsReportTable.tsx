import React, { useState, useMemo, useCallback } from 'react';
import { useDataCache } from '@/hooks/useDataCache';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';
import { Trip, TripStatus } from '@/types';
import { TripWithExpenses, statusLabels } from '@/types/reports';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { escapeCsvCell } from '@/utils/reportsUtils';
import { TripsReportSummaryStats } from './TripsReportSummaryStats';
import { TripsReportFilters } from './TripsReportFilters';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchExpenses = useCallback(async (): Promise<Record<string, number>> => {
    if (!trips || trips.length === 0) return {};
    const tripIds = trips.map(trip => trip.id);
    const { data, error } = await supabase.rpc('get_expenses_for_trips', { trip_ids: tripIds });

    if (error) {
      console.error('Error fetching trip expenses:', error);
      toast({
        title: "Ошибка при загрузке расходов",
        description: error.message,
        variant: "destructive",
      });
      return {};
    }
    
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return data as Record<string, number>;
    }
    
    return {};
  }, [trips, toast]);

  const { data: expensesData = {} } = useDataCache<Record<string, number>>(
    trips && trips.length > 0 ? 'trips-expenses' : null,
    fetchExpenses,
    { ttl: 2 * 60 * 1000 }
  );

  const processedTrips = useMemo((): TripWithExpenses[] => {
    return trips.map(trip => {
      const totalExpenses = expensesData[trip.id] || 0;
      const revenue = trip.cargo?.value || 0;
      
      let actualProfit = 0;
      let potentialProfit = 0;
      let isProfitActual = false;

      switch (trip.status) {
        case TripStatus.COMPLETED:
          actualProfit = revenue - totalExpenses;
          isProfitActual = true;
          break;
        case TripStatus.CANCELLED:
          actualProfit = -totalExpenses;
          isProfitActual = true;
          break;
        case TripStatus.IN_PROGRESS:
        case TripStatus.PLANNED:
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

    if (statusFilter !== 'all') {
      result = result.filter(trip => trip.status === statusFilter);
    }

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
    const completedTrips = filteredAndSortedTrips.filter(trip => trip.status === TripStatus.COMPLETED);
    const cancelledTrips = filteredAndSortedTrips.filter(trip => trip.status === TripStatus.CANCELLED);
    const activeTrips = filteredAndSortedTrips.filter(trip => 
      trip.status === TripStatus.IN_PROGRESS || trip.status === TripStatus.PLANNED
    );

    const actualRevenue = completedTrips.reduce((sum, trip) => sum + (trip.cargo?.value || 0), 0);
    const actualExpenses = [...completedTrips, ...cancelledTrips].reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const actualProfit = completedTrips.reduce((sum, trip) => sum + trip.actualProfit, 0) + 
                        cancelledTrips.reduce((sum, trip) => sum + trip.actualProfit, 0);

    const potentialRevenue = activeTrips.reduce((sum, trip) => sum + (trip.cargo?.value || 0), 0);
    const potentialExpenses = activeTrips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
    const potentialProfit = activeTrips.reduce((sum, trip) => sum + trip.potentialProfit, 0);

    const totalRevenue = actualRevenue + potentialRevenue;
    const totalExpenses = actualExpenses + potentialExpenses;
    const totalWeight = filteredAndSortedTrips.reduce((sum, trip) => sum + (trip.cargo?.weight || 0), 0);
    
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
      totalWeight: totalWeight / 1000, 
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
      headers.map(escapeCsvCell).join(','),
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
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
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
      <TripsReportSummaryStats summaryStats={summaryStats} />
      <TripsReportFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onExport={handleExport}
        trips={filteredAndSortedTrips}
        contractors={contractors}
        onSort={handleSort}
      />
    </div>
  );
};
