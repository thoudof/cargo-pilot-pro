
import React, { useState, useEffect } from 'react';
import { Trip, Contractor } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { TripForm } from './TripForm';
import { useToast } from '@/hooks/use-toast';
import { TripDetails } from './TripDetails';
import { TripCard } from './TripCard';
import { TripListFilters } from './TripListFilters';
import { TripListEmptyState } from './TripListEmptyState';

export const TripList: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [tripExpenses, setTripExpenses] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tripsData, contractorsData] = await Promise.all([
        supabaseService.getTrips(),
        supabaseService.getContractors()
      ]);
      setTrips(tripsData);
      setContractors(contractorsData);
      
      // Загружаем расходы для каждого рейса
      const expensesPromises = tripsData.map(async (trip) => {
        try {
          const expenses = await supabaseService.getTripExpenses(trip.id);
          const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
          return { tripId: trip.id, total };
        } catch (error) {
          console.error(`Failed to load expenses for trip ${trip.id}:`, error);
          return { tripId: trip.id, total: 0 };
        }
      });
      
      const expensesResults = await Promise.all(expensesPromises);
      const expensesMap = expensesResults.reduce((acc, { tripId, total }) => {
        acc[tripId] = total;
        return acc;
      }, {} as Record<string, number>);
      
      setTripExpenses(expensesMap);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrip = () => {
    setEditingTrip(undefined);
    setFormOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setFormOpen(true);
  };

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailsOpen(true);
  };

  const handleDeleteTrip = async (trip: Trip) => {
    try {
      await supabaseService.deleteTrip(trip.id);
      await loadData();
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
  };

  const handleFormSuccess = () => {
    loadData();
  };

  const getContractorName = (contractorId: string) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.companyName || 'Неизвестный контрагент';
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.pointA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pointB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContractorName(trip.contractorId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
