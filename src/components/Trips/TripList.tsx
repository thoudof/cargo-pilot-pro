import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trip } from '@/types';
import { optimizedSupabaseService } from '@/services/optimizedSupabaseService';
import { TripFormTabs } from './TripFormTabs';
import { useToast } from '@/hooks/use-toast';
import { TripDetails } from './TripDetails';
import { TripCard } from './TripCard';
import { TripListFiltersAdvanced } from './TripListFiltersAdvanced';
import { TripListEmptyState } from './TripListEmptyState';
import { TripBulkActions } from './TripBulkActions';
import { TripBulkEditDialog } from './TripBulkEditDialog';
import { useDataCache } from '@/hooks/useDataCache';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

interface SimpleContractor {
  id: string;
  companyName: string;
}

export const TripList: React.FC = () => {
  const [contractors, setContractors] = useState<SimpleContractor[]>([]);
  const [tripExpenses, setTripExpenses] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contractorFilter, setContractorFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>();
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const { toast } = useToast();

  const { data: trips = [], loading, refetch } = useDataCache<Trip[]>(
    'trips-optimized',
    async () => {
      const result = await optimizedSupabaseService.getTripsOptimized(100);
      return Array.isArray(result) ? result : [];
    },
    { ttl: 2 * 60 * 1000 }
  );

  const { data: contractorsData = [] } = useDataCache<SimpleContractor[]>(
    'contractors',
    async () => {
      const { data, error } = await optimizedSupabaseService.supabase
        .from('contractors')
        .select('id, company_name');
      if (error) throw error;
      return data.map(c => ({ id: c.id, companyName: c.company_name }));
    },
    { ttl: 5 * 60 * 1000 }
  );

  useEffect(() => {
    if (Array.isArray(contractorsData)) {
      setContractors(contractorsData);
    }
  }, [contractorsData]);

  useEffect(() => {
    if (Array.isArray(trips) && trips.length > 0) {
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

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setContractorFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  }, []);

  // Bulk selection handlers
  const handleTripSelect = useCallback((tripId: string, selected: boolean) => {
    setSelectedTripIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(tripId);
      } else {
        newSet.delete(tripId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredTrips.map(t => t.id);
    setSelectedTripIds(new Set(allIds));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTripIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    try {
      const ids = Array.from(selectedTripIds);
      const { error } = await optimizedSupabaseService.supabase
        .from('trips')
        .delete()
        .in('id', ids);

      if (error) throw error;

      optimizedSupabaseService.invalidateCache('trips');
      refetch();
      setSelectedTripIds(new Set());

      toast({
        title: 'Рейсы удалены',
        description: `Успешно удалено ${ids.length} рейс(ов)`
      });
    } catch (error) {
      console.error('Failed to bulk delete trips:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить рейсы',
        variant: 'destructive'
      });
    }
  }, [selectedTripIds, refetch, toast]);

  const handleBulkEditSuccess = useCallback(() => {
    optimizedSupabaseService.invalidateCache('trips');
    refetch();
    setSelectedTripIds(new Set());
  }, [refetch]);

  const filteredTrips = useMemo(() => {
    if (!Array.isArray(trips) || trips.length === 0) return [];
    
    let result = trips;
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(trip => trip.status === statusFilter);
    }
    
    // Contractor filter
    if (contractorFilter !== 'all') {
      result = result.filter(trip => trip.contractorId === contractorFilter);
    }
    
    // Date from filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      result = result.filter(trip => new Date(trip.departureDate) >= fromDate);
    }
    
    // Date to filter
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(trip => new Date(trip.departureDate) <= toDate);
    }
    
    // Search filter
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
  }, [trips, searchTerm, statusFilter, contractorFilter, dateFromFilter, dateToFilter, getContractorName]);

  const selectedTrips = useMemo(() => 
    filteredTrips.filter(t => selectedTripIds.has(t.id)),
    [filteredTrips, selectedTripIds]
  );

  const allSelected = useMemo(() => 
    filteredTrips.length > 0 && selectedTripIds.size === filteredTrips.length,
    [filteredTrips, selectedTripIds]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TripListFiltersAdvanced
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddTrip={handleAddTrip}
        contractors={contractors}
        contractorFilter={contractorFilter}
        onContractorFilterChange={setContractorFilter}
        dateFromFilter={dateFromFilter}
        onDateFromFilterChange={setDateFromFilter}
        dateToFilter={dateToFilter}
        onDateToFilterChange={setDateToFilter}
        onClearFilters={handleClearFilters}
      />

      <TripBulkActions
        selectedTrips={selectedTrips}
        onEdit={() => setBulkEditOpen(true)}
        onDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        totalTrips={filteredTrips.length}
        allSelected={allSelected}
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
              isSelected={selectedTripIds.has(trip.id)}
              onSelectChange={(selected) => handleTripSelect(trip.id, selected)}
              showCheckbox={true}
            />
          ))}
        </div>
      )}

      <TripFormTabs
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

      <TripBulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedTrips={selectedTrips}
        onSuccess={handleBulkEditSuccess}
      />
    </div>
  );
};
