
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trip, Contractor } from '@/types';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';
import { TripForm } from './TripForm';
import { useToast } from '@/hooks/use-toast';
import { TripDetails } from './TripDetails';
import { TripCard } from './TripCard';
import { TripListFilters } from './TripListFilters';
import { TripListEmptyState } from './TripListEmptyState';
import { useDataCache } from '@/hooks/useDataCache';

export const TripList: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [tripExpenses, setTripExpenses] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>();
  const { toast } = useToast();

  // Используем оптимизированный запрос с кэшированием
  const { data: trips = [], loading, refetch } = useDataCache(
    'trips-optimized',
    () => optimizedSupabaseService.getTripsOptimized(100),
    { ttl: 2 * 60 * 1000 } // 2 минуты кэш
  );

  // Загружаем контрагентов с кэшированием
  const { data: contractorsData = [] } = useDataCache(
    'contractors',
    async () => {
      const { data, error } = await optimizedSupabaseService.supabase
        .from('contractors')
        .select('id, company_name');
      if (error) throw error;
      return data.map(c => ({ id: c.id, companyName: c.company_name }));
    },
    { ttl: 5 * 60 * 1000 } // 5 минут кэш
  );

  useEffect(() => {
    setContractors(contractorsData);
  }, [contractorsData]);

  // Загружаем расходы батчем только при наличии рейсов
  useEffect(() => {
    if (trips.length > 0) {
      loadTripExpensesBatch(trips.map(trip => trip.id));
    }
  }, [trips]);

  const loadTripExpensesBatch = useCallback(async (tripIds: string[]) => {
    try {
      const expensesMap = await optimizedSupabaseService.getTripExpensesBatch(tripIds);
      setTripExpenses(expensesMap);
    } catch (error) {
      console.error('Failed to load expenses batch:', error);
    }
  }, []);

  const handleAddTrip = useCallback(() => {
    setEditingTrip(undefined);
    setFormOpen(true);
  }, []);

  const handleEditTrip = useCallback((trip: Trip) => {
    setEditingTrip(trip);
    setFormOpen(true);
  }, []);

  const handleViewDetails = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
    setDetailsOpen(true);
  }, []);

  const handleDeleteTrip = useCallback(async (trip: Trip) => {
    try {
      await optimizedSupabaseService.supabase
        .from('trips')
        .delete()
        .eq('id', trip.id);
      
      // Инвалидируем кэш
      optimizedSupabaseService.invalidateCache('trips');
      refetch();
      
      toast({
        title: 'Рейс удален',
        description: `Рейс ${trip.pointA} → ${trip.pointB} успешно удален`
      });
    } catch (error) {
      console.error('Failed to delete trip:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить рейс',
        variant: 'destructive'
      });
    }
  }, [refetch, toast]);

  const handleFormSuccess = useCallback(() => {
    optimizedSupabaseService.invalidateCache('trips');
    refetch();
  }, [refetch]);

  const getContractorName = useCallback((contractorId: string) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.companyName || 'Неизвестный контрагент';
  }, [contractors]);

  // Оптимизированная фильтрация с мемоизацией
  const filteredTrips = useMemo(() => {
    if (!trips.length) return [];
    
    let result = trips;
    
    // Фильтр по статусу
    if (statusFilter !== 'all') {
      result = result.filter(trip => trip.status === statusFilter);
    }
    
    // Поиск по тексту
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(trip => 
        trip.pointA.toLowerCase().includes(searchLower) ||
        trip.pointB.toLowerCase().includes(searchLower) ||
        trip.driver.name.toLowerCase().includes(searchLower) ||
        trip.vehicle.licensePlate.toLowerCase().includes(searchLower) ||
        getContractorName(trip.contractorId).toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [trips, searchTerm, statusFilter, getContractorName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TripListFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddTrip={handleAddTrip}
      />

      {filteredTrips.length === 0 ? (
        <TripListEmptyState
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onAddTrip={handleAddTrip}
        />
      ) : (
        <div className="grid gap-4">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              contractors={contractors}
              tripExpenses={tripExpenses}
              onViewDetails={handleViewDetails}
              onEditTrip={handleEditTrip}
              onDeleteTrip={handleDeleteTrip}
            />
          ))}
        </div>
      )}

      <TripForm
        trip={editingTrip}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />

      <TripDetails
        trip={selectedTrip}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};
