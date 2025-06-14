import { supabase } from '@/integrations/supabase/client';
import type { Trip, TripStatus } from '@/types';

// Простой кэш для оптимизированного сервиса
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.timestamp + cached.ttl) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
};

const setCachedData = <T>(key: string, data: T, ttl: number = 5 * 60 * 1000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

interface DashboardStats {
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
  monthlyStats: Array<{
    month: string;
    trips: number;
    revenue: number;
    weight: number;
    expenses: number;
  }>;
  averageCargoValue: number;
  completionRate: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
}

class OptimizedSupabaseService {
  private batchSize = 50;
  private activeRequests = new Map<string, Promise<any>>();

  // Expose supabase client for direct access
  get supabase() {
    return supabase;
  }

  // Предотвращение дублирования запросов
  private async dedupRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.activeRequests.delete(key);
    });

    this.activeRequests.set(key, promise);
    return promise;
  }

  // Батч-запрос для расходов по рейсам
  async getTripExpensesBatch(tripIds: string[]): Promise<Record<string, number>> {
    if (!tripIds.length) return {};
    
    const cacheKey = `trip-expenses-batch-${tripIds.sort().join(',')}`;
    
    return this.dedupRequest(cacheKey, async () => {
      const cached = getCachedData<Record<string, number>>(cacheKey);
      if (cached) return cached;

      try {
        const { data, error } = await supabase
          .from('trip_expenses')
          .select('trip_id, amount')
          .in('trip_id', tripIds);

        if (error) throw error;

        const expensesMap = data?.reduce((acc, expense) => {
          if (!acc[expense.trip_id]) {
            acc[expense.trip_id] = 0;
          }
          acc[expense.trip_id] += expense.amount;
          return acc;
        }, {} as Record<string, number>) || {};

        setCachedData(cacheKey, expensesMap, 3 * 60 * 1000);
        return expensesMap;
      } catch (error) {
        console.error('Failed to get trip expenses batch:', error);
        return {};
      }
    });
  }

  // Оптимизированный запрос рейсов
  async getTripsOptimized(limit = 100, offset = 0): Promise<Trip[]> {
    const cacheKey = `trips-optimized-${limit}-${offset}`;
    
    return this.dedupRequest(cacheKey, async () => {
      const cached = getCachedData<Trip[]>(cacheKey);
      if (cached) return cached;

      try {
        const { data, error } = await supabase
          .from('trips')
          .select(`
            id,
            status,
            departure_date,
            arrival_date,
            point_a,
            point_b,
            contractor_id,
            driver_id,
            vehicle_id,
            route_id,
            cargo_type_id,
            driver_name,
            driver_phone,
            driver_license,
            vehicle_brand,
            vehicle_model,
            vehicle_license_plate,
            vehicle_capacity,
            cargo_description,
            cargo_weight,
            cargo_volume,
            cargo_value,
            comments,
            documents,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        const transformedData: Trip[] = data?.map(trip => ({
          id: trip.id,
          status: trip.status as TripStatus,
          departureDate: new Date(trip.departure_date),
          arrivalDate: trip.arrival_date ? new Date(trip.arrival_date) : undefined,
          pointA: trip.point_a,
          pointB: trip.point_b,
          contractorId: trip.contractor_id,
          driverId: trip.driver_id,
          vehicleId: trip.vehicle_id,
          routeId: trip.route_id,
          cargoTypeId: trip.cargo_type_id,
          driver: {
            name: trip.driver_name,
            phone: trip.driver_phone,
            license: trip.driver_license
          },
          vehicle: {
            brand: trip.vehicle_brand,
            model: trip.vehicle_model,
            licensePlate: trip.vehicle_license_plate,
            capacity: trip.vehicle_capacity
          },
          cargo: {
            description: trip.cargo_description,
            weight: trip.cargo_weight,
            volume: trip.cargo_volume,
            value: trip.cargo_value
          },
          comments: trip.comments,
          documents: (Array.isArray(trip.documents) ? trip.documents : []) as string[],
          createdAt: new Date(trip.created_at),
          updatedAt: new Date(trip.updated_at),
          changeLog: []
        })) || [];

        setCachedData(cacheKey, transformedData, 2 * 60 * 100);
        return transformedData;
      } catch (error) {
        console.error('Failed to get trips optimized:', error);
        throw error;
      }
    });
  }

  // Оптимизированная статистика дашборда
  async getDashboardStatsOptimized(): Promise<DashboardStats> {
    const cacheKey = 'dashboard-stats-optimized';
    
    return this.dedupRequest(cacheKey, async () => {
      const cached = getCachedData<DashboardStats>(cacheKey);
      if (cached) return cached;

      try {
        const user = await supabase.auth.getUser();
        if (!user.data.user) throw new Error('User not authenticated');

        const [
          { data: trips, error: tripsError },
          { data: contractors, error: contractorsError },
          { data: drivers, error: driversError },
          { data: vehicles, error: vehiclesError },
          { data: expenses, error: expensesError }
        ] = await Promise.all([
          supabase.from('trips').select('id, status, cargo_value, cargo_weight, cargo_volume, created_at').eq('user_id', user.data.user.id),
          supabase.from('contractors').select('id').eq('user_id', user.data.user.id),
          supabase.from('drivers').select('id').eq('user_id', user.data.user.id),
          supabase.from('vehicles').select('id').eq('user_id', user.data.user.id),
          supabase.from('trip_expenses').select('amount, expense_date').eq('user_id', user.data.user.id)
        ]);

        if (tripsError || contractorsError || driversError || vehiclesError || expensesError) {
          throw new Error('Failed to fetch dashboard data');
        }

        const activeTrips = trips?.filter(t => t.status === 'in_progress').length || 0;
        const totalTrips = trips?.length || 0;
        const completedTrips = trips?.filter(t => t.status === 'completed').length || 0;
        const plannedTrips = trips?.filter(t => t.status === 'planned').length || 0;
        const cancelledTrips = trips?.filter(t => t.status === 'cancelled').length || 0;

        const totalCargoValue = trips?.reduce((sum, t) => sum + (t.cargo_value || 0), 0) || 0;
        const completedCargoValue = trips?.filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.cargo_value || 0), 0) || 0;
        
        const totalWeight = trips?.reduce((sum, t) => sum + (t.cargo_weight || 0), 0) || 0;
        const totalVolume = trips?.reduce((sum, t) => sum + (t.cargo_volume || 0), 0) || 0;
        const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

        const monthlyStats = this.generateMonthlyStatsOptimized(trips || [], expenses || []);

        const result: DashboardStats = {
          activeTrips,
          totalTrips,
          completedTrips,
          plannedTrips,
          cancelledTrips,
          contractors: contractors?.length || 0,
          drivers: drivers?.length || 0,
          vehicles: vehicles?.length || 0,
          totalCargoValue,
          completedCargoValue,
          totalWeight,
          totalVolume,
          monthlyStats,
          averageCargoValue: completedTrips > 0 ? completedCargoValue / completedTrips : 0,
          completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
          totalExpenses,
          profit: completedCargoValue - totalExpenses,
          profitMargin: completedCargoValue > 0 ? ((completedCargoValue - totalExpenses) / completedCargoValue) * 100 : 0
        };

        setCachedData(cacheKey, result, 3 * 60 * 1000);
        return result;
      } catch (error) {
        console.error('Failed to get dashboard stats optimized:', error);
        throw error;
      }
    });
  }

  private generateMonthlyStatsOptimized(trips: any[], expenses: any[]) {
    const monthNames = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Ноя', 'Дек'];
    const currentDate = new Date();
    const stats = [];

    const tripsByMonth = new Map();
    const expensesByMonth = new Map();

    trips.forEach(trip => {
      const date = new Date(trip.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!tripsByMonth.has(key)) {
        tripsByMonth.set(key, []);
      }
      tripsByMonth.get(key).push(trip);
    });

    expenses.forEach(expense => {
      const date = new Date(expense.expense_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!expensesByMonth.has(key)) {
        expensesByMonth.set(key, []);
      }
      expensesByMonth.get(key).push(expense);
    });

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      
      const monthTrips = tripsByMonth.get(key) || [];
      const monthExpenses = expensesByMonth.get(key) || [];

      stats.push({
        month: monthName,
        trips: monthTrips.length,
        revenue: monthTrips.reduce((sum, t) => sum + (t.cargo_value || 0), 0),
        weight: Math.round(monthTrips.reduce((sum, t) => sum + (t.cargo_weight || 0), 0) / 1000),
        expenses: monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      });
    }

    return stats;
  }

  // Инвалидация кэша
  invalidateCache(pattern?: string) {
    this.activeRequests.clear();
    cache.clear();
  }
}

export const optimizedSupabaseService = new OptimizedSupabaseService();
