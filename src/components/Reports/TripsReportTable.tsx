import React, { useState, useMemo, useCallback } from 'react';
import { useDataCache } from '@/hooks/useDataCache';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';
import { Trip, TripStatus } from '@/types';
import { TripWithExpenses } from '@/types/reports';
import { TripsReportSummaryStats } from './TripsReportSummaryStats';
import { TripsReportFilters } from './TripsReportFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      return (data || []).reduce((acc: Record<string, string>, c: any) => {
        acc[c.id] = c.company_name;
        return acc;
      }, {});
    },
    { ttl: 5 * 60 * 1000 }
  );

  const fetchExpenses = useCallback(async (): Promise<Record<string, number>> => {
    if (!trips || trips.length === 0) return {};
    const tripIds = trips.map(trip => trip.id);
    
    // Fetch expenses directly instead of using non-existent RPC
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('trip_id, amount')
      .in('trip_id', tripIds);

    if (error) {
      console.error('Error fetching trip expenses:', error);
      toast({
        title: "Ошибка при загрузке расходов",
        description: error.message,
        variant: "destructive",
      });
      return {};
    }
    
    // Aggregate expenses by trip_id
    const expensesMap: Record<string, number> = {};
    data?.forEach(expense => {
      if (!expensesMap[expense.trip_id]) {
        expensesMap[expense.trip_id] = 0;
      }
      expensesMap[expense.trip_id] += expense.amount;
    });
    
    return expensesMap;
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

      // Прибыль только для завершённых рейсов, для остальных = 0
      switch (trip.status) {
        case TripStatus.COMPLETED:
          actualProfit = revenue - totalExpenses;
          isProfitActual = true;
          break;
        case TripStatus.CANCELLED:
          // Для отменённых рейсов прибыль = 0, расходы показываем отдельно
          actualProfit = 0;
          isProfitActual = true;
          break;
        case TripStatus.IN_PROGRESS:
        case TripStatus.PLANNED:
          // Для незавершённых - потенциальная прибыль (справочно)
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
        trips={filteredAndSortedTrips}
        contractors={contractors}
        onSort={handleSort}
        summaryStats={summaryStats}
      />
    </div>
  );
};
